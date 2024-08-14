function reunite() {
  const ss = SpreadsheetApp.openById("1fS1jAeFjIGyfPLI1N48GBZWsJ6-oce7U8v8XPLVZ4Rs");
  const inputSheet = ss.getSheetByName("固定");
  const outputSheet = ss.getSheetByName("未アサイン清掃");
  
  const inputRange = inputSheet.getRange("A2:S" + inputSheet.getLastRow());
  const inputValues = inputRange.getValues();
  const outputValues = [];
  
  // outputValuesを作成
  for (let i = 0; i < inputValues.length; i++) {
    const row = inputValues[i];
    if (row[4] === "" && row[2] === "matsuritech") {
      outputValues.push([row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[12], row[18]]);
    }
  }
  
  const lastRow = outputSheet.getLastRow();
  
  // データが存在する場合のみクリア処理を実行
  if (lastRow > 3) {
    outputSheet.getRange("A4:J" + lastRow).clear();
    outputSheet.getRange("E4:E" + lastRow).clearDataValidations();
  }

  if (outputValues.length > 0) {
    // outputSheetにoutputValuesを書き込む
    outputSheet.getRange(4, 1, outputValues.length, outputValues[0].length).setValues(outputValues);
    
    // E列と10列目にプルダウンを設定
    const eColumnValues = inputValues.map(row => row[4]).filter(val => val !== "" && val !== "作業員名");
    const dropdownOptions = ["1", "2", "3","4","5","6","7","8","9","10"]; // プルダウンの選択肢を設定
    
    // E列（5列目）にプルダウンを設定
    const validationRangeE = outputSheet.getRange(4, 5, outputValues.length);
    const ruleE = SpreadsheetApp.newDataValidation()
      .requireValueInList(eColumnValues, true)
      .build();
    validationRangeE.setDataValidation(ruleE);
    
    // 10列目にプルダウンを設定
    const validationRange10 = outputSheet.getRange(4, 10, outputValues.length);
    const rule10 = SpreadsheetApp.newDataValidation()
      .requireValueInList(dropdownOptions, true)
      .build();
    validationRange10.setDataValidation(rule10);
    
    // E列の値を検索し、同じ値を含む行を取得して出力
    addMatchingRows(outputValues);
  }
}


function addMatchingRows() {
  const ss = SpreadsheetApp.openById("1fS1jAeFjIGyfPLI1N48GBZWsJ6-oce7U8v8XPLVZ4Rs");
  const fixedDataSheet = ss.getSheetByName("固定");
  const expressUnassignCleaning = ss.getSheetByName("再アサイン結果");
  const inputSheet = ss.getSheetByName("未アサイン清掃");
  
  const inputRange = fixedDataSheet.getRange("A4:J" + fixedDataSheet.getLastRow());
  const inputValues = inputRange.getValues();
  const outputValues = inputSheet.getRange("A4:J" + inputSheet.getLastRow()).getValues();
  
  let allRows = [];  // Array to hold all matching rows
  let insertRows = [];
  let cleanerNames = []; // Array to hold unique cleaner names

  // 未アサイン清掃シートのデータとのマッチング
  for (let j = 0; j < outputValues.length; j++) {
    const eValue = outputValues[j][4]; // E列の値
    const jValue = outputValues[j][9]; // J列の値 from 未アサイン清掃
    
    if (eValue && jValue) {
      // 未アサイン清掃シートの行を insertRows に追加
      insertRows.push([
        outputValues[j][4],  // E列 (清掃員の名前)
        outputValues[j][0],  // A列
        outputValues[j][1],  // B列
        outputValues[j][5],  // F列
        "",                  // Empty for S列 as it's not available in 未アサイン清掃
        jValue,              // J列 (outputting as I列 value)
        outputValues[j][6],  // G列
        outputValues[j][12]  // M列
      ]);

      // 清掃員名を cleanerNames に追加（重複を考慮せずに追加）
      cleanerNames.push(eValue);
    }
  }

  // ① 重複を取り除いて、清掃員名の一覧を取得
  cleanerNames = [...new Set(cleanerNames)];

  // ② 重複が取り除かれた清掃員名と固定シートのデータをマッチング
  for (let k = 0; k < inputValues.length; k++) {
    const fixedCleanerName = inputValues[k][4]; // 固定シートのE列の値（清掃員名）

    if (cleanerNames.includes(fixedCleanerName)) {
      // マッチングする行を allRows に追加
      allRows.push([
        inputValues[k][4],  // E列 (清掃員の名前)
        inputValues[k][0],  // A列
        inputValues[k][1],  // B列
        inputValues[k][5],  // F列
        inputValues[k][18], // S列
        inputValues[k][8],  // I列の値 from 固定シート
        inputValues[k][6],  // G列
        inputValues[k][12]  // M列
      ]);
    }
  }

  // ③ allRowsを清掃員名でグループ化
  const groupedRows = allRows.reduce((acc, row) => {
    const cleanerName = row[0]; // 1列目が清掃員の名前
    if (!acc[cleanerName]) {
      acc[cleanerName] = [];
    }
    acc[cleanerName].push(row);
    return acc;
  }, {});

  // ④ insertRowsをallRowsの各グループに挿入し、優先順位を調整
  insertRows.forEach(insertRow => {
    const cleanerName = insertRow[0]; // 挿入されるデータの清掃員名
    const insertPriority = insertRow[5]; // 挿入されるデータの優先順位（6列目）

    if (groupedRows[cleanerName]) {
      let adjustedRows = groupedRows[cleanerName].map(row => {
        if (row[5] >= insertPriority) {
          row[5] += 1; // 優先順位が挿入されるものと同じか大きい場合は+1
        }
        return row;
      });
      adjustedRows.push(insertRow); // グループに挿入
      groupedRows[cleanerName] = adjustedRows.sort((a, b) => a[5] - b[5]); // 優先順位でソート
    } else {
      groupedRows[cleanerName] = [insertRow]; // グループがない場合、新しいグループを作成
    }
  });

  // グループ化された行を結合
  let sortedRows = [];
  for (let cleanerName in groupedRows) {
    sortedRows = sortedRows.concat(groupedRows[cleanerName]);
  }

  // データが存在する場合のみクリア処理を実行
  const lastRow = expressUnassignCleaning.getLastRow();
  if (lastRow > 1) {
    expressUnassignCleaning.getRange("A2:H" + lastRow).clearContent();
  }

  // 結果を再アサイン結果シートに出力
  if (sortedRows.length > 0) {
    expressUnassignCleaning.getRange(2, 1, sortedRows.length, 8).setValues(sortedRows);
  }
}



function assign_on_m2m() { 


  // トークンを取得
  var token = getApiToken();
  if (token === null) {
    Logger.log("トークンを取得できませんでした。");
    return; // トークンが取得できなかった場合、処理を中断
  }
  
  const ss = SpreadsheetApp.openById("1fS1jAeFjIGyfPLI1N48GBZWsJ6-oce7U8v8XPLVZ4Rs");
  const operationSheet = ss.getSheetByName('再アサイン結果');

  // 対象のシートからリクエスト内容を取得
  const startRow = 2;
  var nameColumn = operationSheet.getRange("A:A").getValues(); 
  var lastRowWithData = 1; // Start from row 1
  for (var i = 0; i < nameColumn.length; i++) {
      if (nameColumn[i][0] !== "" && nameColumn[i][0] !== null) {
          lastRowWithData = i + 1; 
      }
  }
  var operationData = operationSheet.getRange(startRow, 1, lastRowWithData - startRow + 1, 19).getValues();
  Logger.log(operationData);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // 月は0から始まるので1を足します
  const day = today.getDate();

  // APIリクエスト
  for (var i = 0; i < operationData.length; i++) {


    var cleaningId = operationData[i][1];
    var cleanerId = operationData[i][18];

    const api_url_1 = `https://api-cleaning.m2msystems.cloud/v4/public/cleanings/${cleaningId}/schedule`;



    // 変更後清掃員をassign
    const api_url_3 = `https://api-cleaning.m2msystems.cloud/v3/cleanings/${cleaningId}/cleaners`;


    Logger.log(api_url_3);


    // 日本時間の今日の日付と結合してUNIXタイムに変換
    let scheduleStart = convertDateTimeStringToTimeObject(operationData[i][16]);
    let scheduleEnd = convertDateTimeStringToTimeObject(operationData[i][17]);

    Logger.log(scheduleStart);
    Logger.log(scheduleEnd);


    const payload1 = {
      "year": year,
      "month": month,
      "day": day,
      "startTime": {
        "hour": scheduleStart.hour,
        "minute": scheduleStart.minute,
        "second": scheduleStart.second
      },
      "endTime": {
        "hour": scheduleEnd.hour,
        "minute": scheduleEnd.minute,
        "second": scheduleEnd.second
      }
    };

    var payload3 = {
      "cleanerId": cleanerId
    };

    Logger.log('payload1: ' + JSON.stringify(payload1));
    Logger.log('payload3: ' + JSON.stringify(payload3));

    var options1 = {
      'method' : 'post',
      'contentType': 'application/json',
      'headers': {
        'Authorization': 'Bearer ' + token  // Bearerトークンの正しい設定
      },
      'payload' : JSON.stringify(payload1),
      'muteHttpExceptions': true
    };


    var options3 = {
      'method' : 'post',
      'contentType': 'application/json',
      'headers': {
        'Authorization': 'Bearer ' + token  // Bearerトークンの正しい設定
      },
      'payload' : JSON.stringify(payload3),
      'muteHttpExceptions': true
    };

    Logger.log('options1: ' + JSON.stringify(options1));
    Logger.log('options3: ' + JSON.stringify(options3));
  



    var response3 = UrlFetchApp.fetch(api_url_3, options3);
    var responseText3 = response3.getContentText();
    Logger.log('response3: ' + responseText3);

    var response1 = UrlFetchApp.fetch(api_url_1, options1);
    var responseText1 = response1.getContentText();
    Logger.log('response1: ' + responseText1);

    var result;
    if (responseText1.includes('error')|| responseText3.includes('error')) { // エラーを防ぐ
      result = 'エラーが発生しました';
    } else {
      result = '成功しました';
    }

    Logger.log('result: ' + result);

    // シートに結果を出力
    operationSheet.getRange(i + startRow, 20, 1, 2).setValues([[result, responseText1.replace(/\r\n/g, ''), ]]);


  }

  

}

function convertDateTimeStringToTimeObject(dateTimeString) {
  if (!dateTimeString || dateTimeString === "" || dateTimeString === undefined || dateTimeString === null) {
    return null;
  }

  const date = new Date(dateTimeString);
  if (isNaN(date.getTime())) {
    return null;
  }

  return {
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds()
  };
}






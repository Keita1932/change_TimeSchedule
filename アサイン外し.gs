function offAssign(){
  change_cleaningTime();
  unassign();
}

function change_cleaningTime(){
  var token = getApiToken();
  if (token === null) {
    Logger.log("トークンを取得できませんでした。");
    return; // トークンが取得できなかった場合、処理を中断
  }

  const ss = SpreadsheetApp.openById("1fS1jAeFjIGyfPLI1N48GBZWsJ6-oce7U8v8XPLVZ4Rs");
  const dataSheet = ss.getSheetByName("外し結果");

  // B列、Q列、R列のデータを取得
  let cleaningIds = dataSheet.getRange(2, 2, 29, 1).getValues(); // B列
  let scheduleStarts = dataSheet.getRange(2, 17, 29, 1).getValues();  // Q列
  let scheduleEnds = dataSheet.getRange(2, 18, 29, 1).getValues();  // R列

  let combinedData = [];
  for (let i = 0; i < cleaningIds.length; i++) {
    if (cleaningIds[i][0] !== "" || scheduleStarts[i][0] !== "" || scheduleEnds[i][0] !== "") {
      combinedData.push([cleaningIds[i][0], scheduleStarts[i][0], scheduleEnds[i][0]]);
    }
  }

  Logger.log(combinedData);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // 月は0から始まるので1を足します
  const day = today.getDate();

  for (let i = 0; i < combinedData.length; i++) {
    let cleaningId = combinedData[i][0];
    const api_url = `https://api-cleaning.m2msystems.cloud/v4/public/cleanings/${cleaningId}/schedule`;

    let scheduleStart = convertDateTimeStringToTimeObject(combinedData[i][1]);
    let scheduleEnd = convertDateTimeStringToTimeObject(combinedData[i][2]);
    
    const payload = {
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

    var options1 = {
      'method' : 'post',
      'contentType': 'application/json',
      'headers': {
        'Authorization': 'Bearer ' + token  // Bearerトークンの正しい設定
      },
      'payload' : JSON.stringify(payload),
      'muteHttpExceptions': true
    };

    Logger.log('options1: ' + JSON.stringify(options1));

    var response1 = UrlFetchApp.fetch(api_url, options1);
    var responseText1 = response1.getContentText();
    Logger.log('response1: ' + responseText1);

    var result;
    if (responseText1.includes('error')) { // エラーを防ぐ
      result = 'エラーが発生しました';
    } else {
      result = '成功しました';
    }

    Logger.log('result: ' + result);
  }
}


function unassign(){
  var token = getApiToken();
  if (token === null) {
    Logger.log("トークンを取得できませんでした。");
    return; // トークンが取得できなかった場合、処理を中断
  }

  const ss = SpreadsheetApp.openById("1fS1jAeFjIGyfPLI1N48GBZWsJ6-oce7U8v8XPLVZ4Rs");
  const dataSheet = ss.getSheetByName("外し結果");

  let cleaningIds = dataSheet.getRange(31, 2, 10, 1).getValues();

  for (let i = 0; i < cleaningIds.length; i++) {
    let cleaningId = cleaningIds[i][0];
    if (cleaningId === "") continue; // 空のIDをスキップ
    const api_url = `https://api-cleaning.m2msystems.cloud/v4/unassign/allCleaners/${cleaningId}`;

    var options = {
      'method' : 'DELETE',
      'contentType': 'application/json',
      'headers': {
        'Authorization': 'Bearer ' + token  // Bearerトークンの正しい設定
      },
      'muteHttpExceptions': true
    };

    var response2 = UrlFetchApp.fetch(api_url, options);
    var responseText2 = response2.getContentText();
    Logger.log('response2: ' + responseText2);

    var result;
    if (responseText2.includes('error')) { // エラーを防ぐ
      result = 'エラーが発生しました';
    } else {
      result = '成功しました';
    }

    Logger.log('result: ' + result);
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

//aaaa
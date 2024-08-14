function express_mainSheet() {
  let ss = SpreadsheetApp.openById("1fS1jAeFjIGyfPLI1N48GBZWsJ6-oce7U8v8XPLVZ4Rs");
  
  // ①固定シートのデータを取得
  let fixedSheet = ss.getSheetByName("固定");
  let fixedDataLastRow = fixedSheet.getLastRow();
  let fixedData = fixedSheet.getRange(4, 1, fixedDataLastRow - 3, 19).getValues();

  // アサイン外しのB3の値を取得
  let detailedSheet = ss.getSheetByName("アサイン外し");
  let cellB3Value = detailedSheet.getRange("B3").getValue();

  detailedSheet.getRange("H1:I1").clearContent();

  // E列がB3の値と一致する行をフィルタリング
  let filteredRows = fixedData.filter(row => row[4] === cellB3Value);

  // 列の順序を入れ替える関数
  let rearrangeColumns = row => [
    row[4],  // 5列目を1列目に
    row[0],  // 1列目を2列目に
    row[1],  // 2列目を3列目に
    row[5],  // 6列目を4列目に
    row[7],  // 8列目を5列目に
    row[8],  // 9列目を6列目に
    row[6],  // 7列目を7列目に
    row[12]
  ];

  let beforeData = filteredRows.map(rearrangeColumns);

  // BeforeDataを16行目以降に出力する前にB16:Iをクリア
  detailedSheet.getRange("B16:I29").clearContent();

  // BeforeDataを16行目以降に出力
  if (beforeData.length > 0) {
    detailedSheet.getRange(16, 2, beforeData.length, 8).setValues(beforeData);
  }

  // D3:E12の値を取得
  let columnCValues = detailedSheet.getRange("C3:C12").getValues();
  let columnDValues = detailedSheet.getRange("D3:D12").getValues();

  // D列とE列のペアをフィルタリング
  let pickupData = beforeData.filter(row => {
    for (let i = 0; i < columnCValues.length; i++) {
      if (row[2] === columnCValues[i][0] && row[3] === columnDValues[i][0]) {
        return true;
      }
    }
    return false;
  });

  // AfterDataを作成し、6列目を削除して各行に番号を付ける
  let afterData = beforeData.filter(row => {
    return !pickupData.some(pickupRow => pickupRow.toString() === row.toString());
  }).map((row, index) => {
    let newRow = [
      row[0],    // 元の1列目
      row[1],    // 元の2列目
      row[2],    // 元の3列目
      row[3],    // 元の4列目
      row[4],    // 元の5列目
      index + 1, // 6列目に番号を付ける
      row[6],    // 元の7列目
      row[7]     // 元の8列目
    ];
    return newRow;
  });

  // pickupDataとafterDataを出力する前に該当範囲をクリア
  detailedSheet.getRange("B31:I").clearContent();

  if (afterData.length > 0) {
    detailedSheet.getRange(31, 2, afterData.length, 8).setValues(afterData);
  }

  // 行ごとに配列で格納したデータの処理
  Logger.log(beforeData);
  Logger.log(pickupData);
  Logger.log(afterData);

  // pickupDataとafterDataをreturnして次の関数で使用
  return { pickupData, afterData }; // 修正点: returnで値を返す
}

function making_delete_assigh_sheet(pickupData, afterData) {
  let ss = SpreadsheetApp.openById("1fS1jAeFjIGyfPLI1N48GBZWsJ6-oce7U8v8XPLVZ4Rs");
  let inputSheet = ss.getSheetByName("アサイン外し");
  let resultSheet = ss.getSheetByName("外し結果");

  // "アサイン外し"シートからB31:I50のデータを取得
  let dataRange = inputSheet.getRange("B31:I50");
  let data = dataRange.getValues();

  // "外し結果"シートの2行目以降にデータを設定
  resultSheet.getRange("A2:H28").clear();
  resultSheet.getRange(2, 1, data.length, 8).setValues(data);  // 修正: data.length を使用

  // pickupDataの1列目を空白にする
  let modifiedPickupData = pickupData.map(row => {
    row[0] = ""; // 1列目を空白にする
    return row;
  });

  // modifiedPickupDataを出力する範囲をクリア
  resultSheet.getRange(31, 1, modifiedPickupData.length, 8).clearContent();

  // modifiedPickupDataを"外し結果"シートの一番下の行に追加
  if (modifiedPickupData.length > 0) {
    resultSheet.getRange(31, 1, modifiedPickupData.length, 8).setValues(modifiedPickupData);
  }
}

function runBothFilters() {
  let { pickupData, afterData } = express_mainSheet(); // 修正点: 戻り値を受け取る
  making_delete_assigh_sheet(pickupData, afterData);
}



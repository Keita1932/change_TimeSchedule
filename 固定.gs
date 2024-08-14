function fixing() {
  var ss = SpreadsheetApp.openById("1fS1jAeFjIGyfPLI1N48GBZWsJ6-oce7U8v8XPLVZ4Rs");
  var liquid = ss.getSheetByName("input");
  var solid = ss.getSheetByName("固定");

  // 最後の行を取得
  var lastRow = liquid.getLastRow();
  if (lastRow < 4) {
    return; // コピーするデータがない場合は終了
  }

  // A4からS列までの範囲の全データを取得
  var liquidData = liquid.getRange("A4:S" + lastRow).getValues();

  // 固定シートのA4からS列までの範囲をクリア
  solid.getRange("A4:S" + solid.getLastRow()).clearContent();

  // 固定シートのA4からS列までに値を設定
  solid.getRange("A4").offset(0, 0, liquidData.length, liquidData[0].length).setValues(liquidData);
}

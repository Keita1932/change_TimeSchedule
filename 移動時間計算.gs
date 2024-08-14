function calculateTravelTimes2() {
  const spreadsheetId = '1fS1jAeFjIGyfPLI1N48GBZWsJ6-oce7U8v8XPLVZ4Rs';  // ここにスプレッドシートのIDを入力
  const sheetName = '外し結果';  // ここにシート名を入力
  const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
  
  const data = sheet.getDataRange().getValues();
  
  // L列をクリア
  sheet.getRange("K2:K").clearContent();  // ヘッダー行を除く全行をクリア (0インデックスで28がL列)

  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) {  // A列が空白の場合
      break;  // 処理を停止
    }
    
    if (data[i][0] === data[i - 1][0]) {  // A列の値を比較 (0インデックスで4がE列)
      const lat1 = data[i - 1][8] / 1e6;  // I列 (0インデックスで8)、整数を度に変換
      const lon1 = data[i - 1][9] / 1e6;  // \j列 (0インデックスで9)、整数を度に変換
      const lat2 = data[i][8] / 1e6;
      const lon2 = data[i][9] / 1e6;
      
      const distance = calculateDistance2(lat1, lon1, lat2, lon2);  // 距離 (km)
      

      // 徒歩での移動時間を計算 (h)
      const walkingTime = distance / 5; // 平均5km/h
      // 公共交通での移動時間を計算 (h)
      let transitTime = distance / 25; // 平均25km/h

      // 公共交通の移動時間に30分を加算 (h)
      transitTime += 0.5;  // 30分を時間に変換して加算

      // 最も短い移動時間を選択し、最低時間を加算
      const shortestTime = Math.min(walkingTime, transitTime) + (30 / 60); // 10分を時間(h)に変換して加算
      
      // 移動時間を分単位に変換して出力、最低時間を考慮
      const shortestTimeInMinutes = Math.round(shortestTime * 60);
      
      Logger.log(shortestTimeInMinutes);

      sheet.getRange(i + 1, 11).setValue(shortestTimeInMinutes);  // 移動時間をL列に書き込む (0インデックスで28はAA列)
    } else {
      sheet.getRange(i + 1, 11).setValue('');  // I列の値が違う場合、L列を空白にする
    }
  }
}

// 距離を計算する関数 (ハーパーサインの公式)
function calculateDistance2(lat1, lon1, lat2, lon2) {
  const R = 6371; // 地球の半径 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    0.5 - Math.cos(dLat)/2 + 
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    (1 - Math.cos(dLon))/2;

  return R * 2 * Math.asin(Math.sqrt(a));
}

function shift() {
  //読み込みたいプロジェクトの名前
  const project_id =  "m2m-core";
  
  //実行するクエリ
  const query_execute =  
  `SELECT 
sr.id,
sr.cleaner_id,
u.name,
sr.status,
DATE(FORMAT_TIMESTAMP('%Y-%m-%d',TIMESTAMP_SECONDS(CAST(sr.cleaner_start as INT64 )),'Asia/Tokyo')) AS start_date,
FORMAT_TIMESTAMP('%H:%M:%S',TIMESTAMP_SECONDS(CAST(sr.cleaner_start as INT64 )),'Asia/Tokyo') AS start_time,
DATE(FORMAT_TIMESTAMP('%Y-%m-%d',TIMESTAMP_SECONDS(CAST(sr.cleaner_end as INT64 )),'Asia/Tokyo')) AS end_date,
FORMAT_TIMESTAMP('%H:%M:%S',TIMESTAMP_SECONDS(CAST(sr.cleaner_end as INT64 )),'Asia/Tokyo') AS end_time,
DATE(FORMAT_TIMESTAMP('%Y-%m-%d',TIMESTAMP_SECONDS(CAST(sr.manager_start as INT64 )),'Asia/Tokyo')) AS manager_start_date,
FORMAT_TIMESTAMP('%H:%M:%S',TIMESTAMP_SECONDS(CAST(sr.manager_start as INT64 )),'Asia/Tokyo') AS manager_start_time,
DATE(FORMAT_TIMESTAMP('%Y-%m-%d',TIMESTAMP_SECONDS(CAST(sr.manager_end as INT64 )),'Asia/Tokyo')) AS manager_end_date,
FORMAT_TIMESTAMP('%H:%M:%S',TIMESTAMP_SECONDS(CAST(sr.manager_end as INT64 )),'Asia/Tokyo') AS manager_start_time,



FROM \`m2m-core.m2m_cleaning_prod.shift_records\` sr  

LEFT OUTER JOIN \`m2m-core.m2m_users_prod.user\` u ON sr.cleaner_id = u.id 

where DATE(FORMAT_TIMESTAMP('%Y-%m-%d',TIMESTAMP_SECONDS(CAST(sr.cleaner_start as INT64 )),'Asia/Tokyo')) = CURRENT_DATE("Asia/Tokyo")



ORDER BY u.name,start_time`

  //実行するクエリーの確認
  Logger.log(query_execute)
  //出力先シート名
  const ss = SpreadsheetApp.openById("1fS1jAeFjIGyfPLI1N48GBZWsJ6-oce7U8v8XPLVZ4Rs");
  const output_sheet = ss.getSheetByName("シフト情報")
        　
  output_sheet.setFrozenRows(1);
  const result = BigQuery.Jobs.query(
    {
      useLegacySql: false,
      query: query_execute,
    },
    project_id
  );
  const rows = result.rows.map(row => {
    return row.f.map(cell => cell.v)
  })
  Logger.log(rows)
 output_sheet
 .getRange(
   2, 
   1, 
   rows.length, 
   rows[0].length
 )
 .setValues(rows);


}




//朝5時に1度だけ取得
function getCleanerID() {
  const projectId = "m2m-core";

  const queryExective = `
    SELECT 
      id,
      name
    FROM \`m2m-core.m2m_users_prod.user\`
  `;

  Logger.log(queryExective);

  const ss = SpreadsheetApp.openById("1fS1jAeFjIGyfPLI1N48GBZWsJ6-oce7U8v8XPLVZ4Rs");
  const outputSheet = ss.getSheetByName("cleanerID");

  // シートの範囲をクリア
  outputSheet.getRange("A2:B").clearContent();

  const result = BigQuery.Jobs.query({
    useLegacySql: false,
    query: queryExective,
  }, projectId);

  // BigQueryの結果を2次元配列に変換する関数
  const rows = result.rows.map(row => {
    return row.f.map(cell => cell.v);
  });

  Logger.log(rows);

  // 結果をシートに出力
  if (rows.length > 0) {
    outputSheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }
}

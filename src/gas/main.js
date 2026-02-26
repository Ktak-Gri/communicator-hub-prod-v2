/**
 * コミュニケーター育成HUB - Backend (Google Apps Script)
 * VERSION: V6.40.55 (STABILITY_FIX)
 */

var VERSION_STRING = "V6.40.55";
var DEFAULT_SS_ID = '1DkyoKVZ6_iEY2WCQp_eLx3F_har_bCwkkkV-N1wdh6M';

/**
 * 究極のID正規化関数
 * 全角・半角・数値サフィックス(.0)・空白・大文字小文字の差異を完全に吸収します。
 */
function normalizeId(val) {
  if (val === null || val === undefined) return "";
  var s = String(val).trim();
  
  // Google Sheetsの数値型セルが ".0" を伴う文字列として読み込まれる現象への対策
  if (s.indexOf('.') !== -1 && !isNaN(val)) {
    s = s.replace(/\.0+$/, "");
  }
  
  // 全角英数字を半角に強制変換
  s = s.replace(/[０-９Ａ-Ｚａ-ｚ]/g, function(m) { 
    return String.fromCharCode(m.charCodeAt(0) - 0xFEE0); 
  });
  
  // 空白(全角含む)を除去し、小文字に統一
  return s.replace(/[\s　\t\n\r]/g, "").toLowerCase();
}

function findSheet(ss, name) {
  var sheets = ss.getSheets();
  var target = name.replace(/[\s　]/g, "");
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getName().replace(/[\s　]/g, "") === target) return sheets[i];
  }
  return null;
}

function doGet(e) {
  var callback = e.parameter.callback || "callback";
  var result;
  try {
    var p = e.parameter.p;
    if (!p) throw new Error("No Payload");
    var safeP = p.replace(/ /g, "+");
    var decoded = Utilities.newBlob(Utilities.base64Decode(safeP)).getDataAsString("UTF-8");
    var payload = JSON.parse(decoded);
    
    result = processAction(payload.a, payload.d || {}, payload.t || null);
    result.status = result.status || 'success';
    result.version = VERSION_STRING;
  } catch (err) {
    result = { status: 'error', error: err.message, version: VERSION_STRING };
  }
  var output = callback + "(" + JSON.stringify(result) + ")";
  return ContentService.createTextOutput(output).setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function processAction(action, data, token) {
  var props = PropertiesService.getScriptProperties();
  var ssId = props.getProperty('SPREADSHEET_ID') || DEFAULT_SS_ID;
  var ss = SpreadsheetApp.openById(ssId);

  // 権限チェック (削除系は必須)
  var restricted = ['updateSheet', 'deleteScenario', 'deleteTestQuestion'];
  if (restricted.indexOf(action) !== -1) {
    if (!token || token.indexOf('TOKEN_') !== 0) throw new Error("管理者権限が必要です。再ログインしてください。");
  }

  switch (action) {
    case 'getSettings':
      // 「性質」または「性質マスタ」の両方を試行
      var personalityData = readListFromSheet(ss, '性質');
      if (personalityData.length === 0) personalityData = readListFromSheet(ss, '性質マスタ');

      return {
        data: {
          scenarios: readSheetData(ss, 'シナリオ'),
          testQuestions: readSheetData(ss, 'テスト問題'),
          masterSettings: readSheetData(ss, 'センターマスタ'),
          trainees: readSheetData(ss, '研修生マスタ'),
          ngWords: readListFromSheet(ss, 'NGワード'),
          faqTopics: readListFromSheet(ss, 'テストトピック'),
          personalities: personalityData
        }
      };

    case 'validateTrainee':
      var traineeList = readSheetData(ss, '研修生マスタ');
      var nameToFind = normalizeId(data.name);
      var found = traineeList.filter(function(t) {
        return normalizeId(t.研修生名 || t.traineeName || "") === nameToFind;
      })[0];
      return { data: found || null };

    case 'adminLogin':
      var adminPw = props.getProperty('ADMIN_PASSWORD') || "admin123";
      if (String(data.password).trim() === adminPw) {
        return { data: { token: 'TOKEN_' + Utilities.getUuid() } };
      }
      throw new Error("パスワードが正しくありません。");

    case 'updateSheet':
      var targetSheet = findSheet(ss, data.sheet);
      if (!targetSheet) throw new Error("シート '" + data.sheet + "' が見つかりません。");
      targetSheet.clear();
      if (data.data && data.data.length > 0) {
        targetSheet.getRange(1, 1, data.data.length, data.data[0].length).setValues(data.data);
      }
      return { status: 'success' };

    case 'deleteScenario': return deleteRowById(ss, 'シナリオ', data.id);
    case 'deleteTestQuestion': return deleteRowById(ss, 'テスト問題', data.id);
    case 'saveRolePlayLog': appendToLog(ss, 'ロールプレイングログ', data); return { status: 'success' };
    case 'saveTestLog': appendToLog(ss, 'テストログ', data); return { status: 'success' };

    default:
      throw new Error("不明なアクション: " + action);
  }
}

/**
 * リスト形式（単一列）のデータを読み込む。
 * ヘッダーをスキップし、A列の値を文字列の配列として返す。
 */
function readListFromSheet(ss, name) {
  var sheet = findSheet(ss, name);
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  if (values.length < 1) return [];
  
  var results = [];
  // 1行目はヘッダーとみなし、2行目から読み込むが、
  // もし1行目しかない場合はその1行目をデータとして扱う
  var startIndex = values.length > 1 ? 1 : 0;
  
  for (var i = startIndex; i < values.length; i++) {
    var val = String(values[i][0] || "").trim();
    if (val) results.push(val);
  }
  return results;
}

function readSheetData(ss, name) {
  var sheet = findSheet(ss, name);
  if (!sheet) return [];
  var range = sheet.getDataRange();
  var values = range.getValues();
  if (values.length < 1) return [];
  
  var headers = values[0];
  var results = [];
  for (var i = 1; i < values.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j] || "col_" + j;
      obj[key] = values[i][j];
    }
    // A列をIDとして必ずセット
    obj.id = values[i][0];
    results.push(obj);
  }
  return results;
}

function deleteRowById(ss, sheetName, id) {
  var sheet = findSheet(ss, sheetName);
  if (!sheet) throw new Error("シート '" + sheetName + "' が見つかりません。");
  
  var range = sheet.getDataRange();
  var values = range.getValues();
  var tid = normalizeId(id);
  
  if (!tid) throw new Error("削除対象のIDが空です。");

  // 1列目（ID列）を走査して完全一致を確認
  for (var i = 1; i < values.length; i++) {
    var cellValue = values[i][0];
    if (normalizeId(cellValue) === tid) {
      sheet.deleteRow(i + 1);
      console.log("Deleted ID: " + tid + " from " + sheetName);
      return { status: 'success' };
    }
  }
  throw new Error("管理番号 '" + id + "' はシート '" + sheetName + "' 内に存在しません。");
}

function appendToLog(ss, sheetName, data) {
  var sheet = findSheet(ss, sheetName) || ss.insertSheet(sheetName);
  if (sheet.getLastColumn() === 0) {
    sheet.appendRow(Object.keys(data));
  }
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = headers.map(function(h) {
    var val = data[h];
    return (typeof val === 'object') ? JSON.stringify(val) : val;
  });
  sheet.appendRow(row);
}
/**
 * =================================================================
 * コミュニケーター育成HUB - Backend (Google Apps Script)
 * =================================================================
 * VERSION: V6.22.20 (STABLE_SYNC)
 */

var VERSION_STRING = "V6.22.20";
// 最新のスプレッドシートIDに更新
var DEFAULT_SS_ID = '1DkyoKVZ6_iEY2WCQp_eLx3F_har_bCwkkkV-N1wdh6M';

function normalizeKey(str) {
  if (!str) return "";
  return String(str).replace(/[\s　]\n\r/g, "").trim();
}

function doGet(e) {
  var p = e.parameter.p;
  var callback = e.parameter.callback;
  var result;
  try {
    if (!p) throw new Error("パラメータ 'p' がありません。");
    // GASの仕様で '+' が半角スペースに変換される場合があるための対策
    var safeP = p.replace(/ /g, "+");
    var decoded = Utilities.newBlob(Utilities.base64Decode(safeP)).getDataAsString();
    var payload = JSON.parse(decoded);
    result = processAction(payload.a, payload.d || {}, payload.t || null);
  } catch (err) {
    result = { status: 'error', error: "SERVER_EXEC_ERROR [" + VERSION_STRING + "]: " + err.message };
  }
  var output = callback + "(" + JSON.stringify(result) + ")";
  return ContentService.createTextOutput(output).setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function processAction(action, data, token) {
  var props = PropertiesService.getScriptProperties();
  var ssId = props.getProperty('SPREADSHEET_ID') || DEFAULT_SS_ID;
  var ss;

  try {
    ss = SpreadsheetApp.openById(ssId);
  } catch(e) {
    return { status: 'error', error: "SPREADSHEET_ACCESS_DENIED: ID(" + ssId + ")にアクセスできません。権限設定を確認してください。" };
  }

  var adminActions = ['addScenario', 'updateScenario', 'deleteScenario', 'addTestQuestion', 'updateTestQuestion', 'deleteTestQuestion', 'getAdminRolePlayLogs', 'getAdminTestLogs', 'getAdminQuestioningLogs', 'getAdminAllScenarios', 'getAdminAllTestQuestions', 'updateSheet'];
  if (adminActions.indexOf(action) !== -1) {
    if (!token || token.indexOf('TOKEN_') !== 0) return { status: 'error', error: "ADMIN_SESSION_EXPIRED" };
  }

  switch (action) {
    case 'getSettings':
      return { 
        status: 'success', version: VERSION_STRING,
        data: {
          scenarios: getSheetData(ss, 'シナリオ'),
          ngWords: getSheetData(ss, 'NGワード').map(function(r){ return r.NGワード; }),
          faqTopics: getSheetData(ss, 'テストトピック').map(function(r){ return r.トピック; }),
          testQuestions: getSheetData(ss, 'テスト問題'),
          masterSettings: getSheetData(ss, 'センターマスタ'),
          personalities: getSheetData(ss, '性質マスタ'),
          ageGroups: getSheetData(ss, '年代マスタ'),
          trainees: getSheetData(ss, '研修生マスタ'),
          apiKey: props.getProperty('API_KEY')
        }
      };

    case 'validateTrainee':
      var trainees = getSheetData(ss, '研修生マスタ');
      var inputName = normalizeKey(data.name);
      var found = trainees.filter(function(t) { 
        var target = t.研修生名 || t.traineeName || t.研修生 || t.trainee || "";
        return normalizeKey(target) === inputName; 
      })[0];
      return { status: 'success', data: found || null };

    case 'adminLogin':
      var inputPass = String(data.password || "").trim();
      var scriptPass = props.getProperty('ADMIN_PASSWORD') || "admin123";
      if (inputPass === scriptPass) {
        return { status: 'success', data: { token: 'TOKEN_' + Utilities.getUuid() } };
      }
      return { status: 'error', error: "認証失敗" };

    case 'saveRolePlayLog':
      saveToSheet(ss, 'ロールプレイングログ', data);
      return { status: 'success' };
    
    case 'saveTestLog':
      saveToSheet(ss, 'テストログ', data);
      return { status: 'success' };
    
    case 'saveQuestioningLog':
      saveToSheet(ss, '質問力ログ', data);
      return { status: 'success' };

    case 'getUserHistoryRolePlay':
      var rpLogs = getSheetData(ss, 'ロールプレイングログ').filter(function(r) {
        return (r.traineeName === data.traineeName || r.研修生名 === data.traineeName);
      });
      return { status: 'success', data: { rows: rpLogs } };

    case 'getUserHistoryTest':
      var testLogs = getSheetData(ss, 'テストログ').filter(function(r) {
        return (r.traineeName === data.traineeName || r.研修生名 === data.traineeName);
      });
      return { status: 'success', data: { rows: testLogs } };

    case 'getUserHistoryQuestioning':
      var qLogs = getSheetData(ss, '質問力ログ').filter(function(r) {
        return (r.traineeName === data.traineeName || r.研修生名 === data.traineeName);
      });
      return { status: 'success', data: { rows: qLogs } };

    case 'initiateCall':
      var sessionId = 'SESSION_' + Utilities.getUuid();
      var session = {
        sessionId: sessionId,
        caller: data.caller,
        receiver: data.receiver,
        scenarioId: data.scenarioId,
        status: 'calling',
        transcript: [],
        timestamp: new Date().getTime()
      };
      props.setProperty('CALL_' + data.caller, JSON.stringify(session));
      props.setProperty('CALL_' + data.receiver, JSON.stringify(session));
      return { status: 'success', data: session };

    case 'pollCall':
      var rawSession = props.getProperty('CALL_' + data.traineeName);
      if (!rawSession) return { status: 'success', data: null };
      var sessionObj = JSON.parse(rawSession);
      if (new Date().getTime() - sessionObj.timestamp > 180000) {
        props.deleteProperty('CALL_' + sessionObj.caller);
        props.deleteProperty('CALL_' + sessionObj.receiver);
        return { status: 'success', data: null };
      }
      return { status: 'success', data: sessionObj };

    case 'syncTranscript':
      var sessionKey = 'CALL_' + data.traineeName;
      var raw = props.getProperty(sessionKey);
      if (!raw) return { status: 'error', error: 'Session not found' };
      var s = JSON.parse(raw);
      if (data.transcript) s.transcript = data.transcript;
      if (data.status) s.status = data.status;
      s.timestamp = new Date().getTime();
      var updatedStr = JSON.stringify(s);
      props.setProperty('CALL_' + s.caller, updatedStr);
      props.setProperty('CALL_' + s.receiver, updatedStr);
      return { status: 'success', data: s };

    case 'endCall':
      var key = 'CALL_' + data.traineeName;
      var currentRaw = props.getProperty(key);
      if (currentRaw) {
        var currentS = JSON.parse(currentRaw);
        props.deleteProperty('CALL_' + currentS.caller);
        props.deleteProperty('CALL_' + currentS.receiver);
      }
      return { status: 'success' };

    case 'getAdminAllScenarios': return { status: 'success', data: { rows: getSheetData(ss, 'シナリオ') } };
    case 'getAdminAllTestQuestions': return { status: 'success', data: { rows: getSheetData(ss, 'テスト問題') } };
    case 'getAdminRolePlayLogs': return { status: 'success', data: { rows: getSheetData(ss, 'ロールプレイングログ') } };
    case 'updateSheet':
      var sheet = ss.getSheetByName(data.sheet);
      if (!sheet) return { status: 'error', error: "シート見つからず" };
      sheet.clear();
      sheet.getRange(1, 1, data.data.length, data.data[0].length).setValues(data.data);
      return { status: 'success' };
    default: return { status: 'error', error: "UNKNOWN_ACTION: " + action };
  }
}

function getSheetData(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0].map(function(h) { return h.toString().trim(); });
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    rows.push(obj);
  }
  return rows;
}

function saveToSheet(ss, name, data) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    var keys = Object.keys(data);
    sheet.appendRow(keys);
  }
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = headers.map(function(h) {
    var val = data[h];
    if (typeof val === 'object') return JSON.stringify(val);
    return val || "";
  });
  sheet.appendRow(row);
}
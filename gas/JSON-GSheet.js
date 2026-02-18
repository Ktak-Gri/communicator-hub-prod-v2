
/**
 * filename: JSON-GSheet.js
 * @fileoverview スプレッドシートの構造とデータをJSON形式でエクスポート・インポートするスクリプト。
 * 
 * 注意: 
 * - このファイルは gas/main.js と同じプロジェクト内で動作することを想定しています。
 * - エクスポートされたJSONはスプレッドシートと同じフォルダに保存されます。
 */

/**
 * スプレッドシートを開いたときにカスタムメニューを作成します。
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('⚙️ データ管理')
    .addItem('シート情報をJSONでエクスポート', 'exportSheetDataAsJson')
    .addSeparator()
    .addItem('JSONからシート情報を復元', 'importJsonFromDrive')
    .addToUi();
}

/**
 * スプレッドシートが保存されているフォルダを取得します。
 * 見つからない場合はルートフォルダを返します。
 */
function getTargetFolder() {
  const ssId = SpreadsheetApp.getActiveSpreadsheet().getId();
  const file = DriveApp.getFileById(ssId);
  const parents = file.getParents();
  if (parents.hasNext()) {
    return parents.next();
  }
  return DriveApp.getRootFolder();
}

/**
 * 全シート情報をJSONとしてエクスポートし、現在のフォルダに保存します。
 */
function exportSheetDataAsJson() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const allSheetData = {};

  const sheets = ss.getSheets();
  for (const sheet of sheets) {
    const sheetName = sheet.getName();
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    
    if (lastRow === 0 || lastCol === 0) {
      allSheetData[sheetName] = { data: [], formulas: [] };
      continue;
    }
    
    const dataRange = sheet.getRange(1, 1, lastRow, lastCol);
    
    // 値とR1C1形式の数式を取得
    const values = dataRange.getValues();
    const formulas = dataRange.getFormulasR1C1();

    allSheetData[sheetName] = {
      data: values,
      formulas: formulas
    };
  }

  const jsonString = JSON.stringify(allSheetData, null, 2);
  const fileName = `sheet_backup_${ss.getName()}_${Utilities.formatDate(new Date(), 'JST', 'yyyyMMddHHmmss')}.json`;
  
  // スプレッドシートと同じフォルダに保存
  const folder = getTargetFolder();
  folder.createFile(fileName, jsonString, MimeType.PLAIN_TEXT);
  
  SpreadsheetApp.getUi().alert(`シート情報を「${fileName}」としてフォルダ「${folder.getName()}」にエクスポートしました。`);
}

/**
 * ドライブ上のJSONファイルからシート情報を復元します。
 * ファイル検索は、まずスプレッドシートと同じフォルダから行います。
 */
function importJsonFromDrive() {
  const ui = SpreadsheetApp.getUi();
  const folder = getTargetFolder();
  
  const promptResponse = ui.prompt(
    'データの復元',
    `フォルダ「${folder.getName()}」にあるJSONバックアップファイル名を入力してください:`,
    ui.ButtonSet.OK_CANCEL
  );

  const button = promptResponse.getSelectedButton();
  const fileName = promptResponse.getResponseText();

  if (button !== ui.Button.OK || fileName === '') {
    ui.alert('処理がキャンセルされました。');
    return;
  }

  try {
    // フォルダ内からファイルを検索
    const files = folder.getFilesByName(fileName);
    if (!files.hasNext()) {
      throw new Error(`フォルダ「${folder.getName()}」にファイルが見つかりませんでした: ${fileName}`);
    }
    const file = files.next();
    
    const jsonString = file.getBlob().getDataAsString();
    const allSheetData = JSON.parse(jsonString);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ss.toast('復元処理を開始します...', 'ステータス', -1);

    for (const sheetName in allSheetData) {
      if (Object.prototype.hasOwnProperty.call(allSheetData, sheetName)) {
        const sheetData = allSheetData[sheetName];
        const values = sheetData.data;
        const formulas = sheetData.formulas;

        let sheet = ss.getSheetByName(sheetName);
        if (sheet) {
          sheet.clear(); 
        } else {
          sheet = ss.insertSheet(sheetName);
        }

        if (values.length === 0 || values[0].length === 0) {
          continue;
        }

        const range = sheet.getRange(1, 1, values.length, values[0].length);
        range.setValues(values);

        // 数式の復元
        for (let i = 0; i < formulas.length; i++) {
          for (let j = 0; j < formulas[i].length; j++) {
            if (formulas[i][j]) {
              sheet.getRange(i + 1, j + 1).setFormulaR1C1(formulas[i][j]);
            }
          }
        }
      }
    }

    ss.toast('復元が完了しました。', '完了', 5);
    ui.alert('JSONファイルからシート情報を正常に復元しました。');

  } catch (e) {
    ui.alert(`エラーが発生しました: ${e.message}`);
  }
}

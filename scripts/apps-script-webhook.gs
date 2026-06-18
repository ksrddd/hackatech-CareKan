/**
 * CareKan — API Key Request webhook
 *
 * Deploy as a Web App:
 *   Deploy > New deployment > Web app
 *   Execute as: Me
 *   Who has access: Anyone
 *
 * Paste the deployment URL into backend/.env as GOOGLE_APPS_SCRIPT_URL
 *
 * Expected columns (row order matches HEADERS below):
 *   A: Timestamp | B: Organization | C: Staff name | D: Position
 *   E: Email | F: Phone | G: Purpose | H: Drive links
 */

var SHEET_NAME = 'API Key Requests';

var HEADERS = [
  'Timestamp',
  'Organization Name',
  'Staff Full Name',
  'Position',
  'Organization Email',
  'Contact Phone',
  'Purpose',
  'Drive Links',
];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);

    // Create sheet with headers on first run.
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    }

    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.organizationName || '',
      data.staffFullName || '',
      data.position || '',
      data.organizationEmail || '',
      data.contactPhone || '',
      data.purpose || '',
      data.driveLinks || '',
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/** For manual testing inside Apps Script editor: Run > doGet */
function doGet() {
  return ContentService
    .createTextOutput('CareKan webhook is live.')
    .setMimeType(ContentService.MimeType.TEXT);
}

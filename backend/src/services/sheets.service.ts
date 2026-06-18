import { google } from 'googleapis';

const SPREADSHEET_ID = process.env['GOOGLE_SHEETS_SPREADSHEET_ID'];
const CLIENT_EMAIL = process.env['GOOGLE_SERVICE_ACCOUNT_EMAIL'];
const PRIVATE_KEY = process.env['GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY']?.replace(/\\n/g, '\n');

export interface SheetRow {
  organizationName: string;
  staffFullName: string;
  position: string;
  organizationEmail: string;
  contactPhone: string;
  purpose: string;
  driveLinks: string[];
}

export async function appendRequestToSheet(row: SheetRow): Promise<void> {
  if (!SPREADSHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
    console.warn('[sheets] Missing Google Sheets credentials — skipping sheet append');
    return;
  }
  try {
    const auth = new google.auth.JWT({
      email: CLIENT_EMAIL,
      key: PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          new Date().toISOString(),
          row.organizationName,
          row.staffFullName,
          row.position,
          row.organizationEmail,
          row.contactPhone,
          row.purpose,
          row.driveLinks.join('\n'),
        ]],
      },
    });
  } catch (err) {
    console.error('[sheets] Failed to append row:', err);
    // Do not re-throw — Sheets failure must never block form submission.
  }
}

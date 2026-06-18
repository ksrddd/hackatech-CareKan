const APPS_SCRIPT_URL = process.env['GOOGLE_APPS_SCRIPT_URL'];

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
  if (!APPS_SCRIPT_URL) {
    console.warn('[sheets] GOOGLE_APPS_SCRIPT_URL not set — skipping sheet append');
    return;
  }
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        organizationName: row.organizationName,
        staffFullName: row.staffFullName,
        position: row.position,
        organizationEmail: row.organizationEmail,
        contactPhone: row.contactPhone,
        purpose: row.purpose,
        driveLinks: row.driveLinks.join('\n'),
      }),
    });
    if (!res.ok) {
      console.error(`[sheets] Apps Script returned ${res.status}: ${await res.text()}`);
    }
  } catch (err) {
    console.error('[sheets] Failed to call Apps Script:', err);
    // Do not re-throw — Sheets failure must never block form submission.
  }
}

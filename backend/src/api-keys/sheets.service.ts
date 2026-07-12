import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SheetRow {
  organizationName: string;
  staffFullName: string;
  position: string;
  organizationEmail: string;
  contactPhone: string;
  purpose: string;
  driveLinks: string[];
}

@Injectable()
export class SheetsService {
  private readonly appsScriptUrl: string;

  constructor(config: ConfigService) {
    this.appsScriptUrl = config.get<string>('GOOGLE_APPS_SCRIPT_URL') ?? '';
  }

  async appendRequestToSheet(row: SheetRow): Promise<void> {
    if (!this.appsScriptUrl) {
      console.warn('[sheets] GOOGLE_APPS_SCRIPT_URL not set — skipping sheet append');
      return;
    }
    try {
      const res = await fetch(this.appsScriptUrl, {
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
}

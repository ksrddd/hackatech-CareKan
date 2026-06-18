import {
  useCallback,
  useState,
  type FormEvent,
} from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { api } from '@/shared/api/endpoints';
import { useRequest } from '@/shared/state/useRequest';
import type { ApiKeyRequestForm } from '../../../shared/api';

interface FormFields {
  organizationName: string;
  staffFullName: string;
  position: string;
  organizationEmail: string;
  contactPhone: string;
  purpose: string;
  driveLinksText: string;
  acknowledged: boolean;
}

const blankForm: FormFields = {
  organizationName: '',
  staffFullName: '',
  position: '',
  organizationEmail: '',
  contactPhone: '',
  purpose: '',
  driveLinksText: '',
  acknowledged: false,
};

const DRIVE_URL_RE = /^https?:\/\/(?:drive|docs)\.google\.com\/[^\s]+$/i;

function parseDriveLines(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(/[\r\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  );
}

export function RequestApiKey() {
  const { user } = useAuth();
  const [form, setForm] = useState<FormFields>(blankForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  function set<K extends keyof FormFields>(key: K, value: FormFields[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  const doSubmit = useCallback(
    (_signal: AbortSignal, payload: ApiKeyRequestForm) => api.submitApiKeyRequest(payload),
    [],
  );
  const { state: submitState, run: runSubmit } = useRequest(doSubmit);

  function clientValidate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (form.organizationName.trim().length < 2)
      errs['organizationName'] = 'กรุณาระบุชื่อหน่วยงาน';
    if (form.staffFullName.trim().length < 2)
      errs['staffFullName'] = 'กรุณาระบุชื่อ-นามสกุล';
    if (form.position.trim().length < 2) errs['position'] = 'กรุณาระบุตำแหน่ง';
    if (!/.+@.+\..+/.test(form.organizationEmail))
      errs['organizationEmail'] = 'อีเมลหน่วยงานไม่ถูกต้อง';
    else if (/@(gmail|hotmail|outlook|yahoo|icloud|live)\.com$/i.test(form.organizationEmail))
      errs['organizationEmail'] = 'กรุณาใช้อีเมลของหน่วยงาน (ไม่ใช่ส่วนตัว)';
    if (!/^[0-9+\-\s()]{6,20}$/.test(form.contactPhone))
      errs['contactPhone'] = 'เบอร์โทรไม่ถูกต้อง';
    if (form.purpose.trim().length < 10)
      errs['purpose'] = 'อธิบายวัตถุประสงค์อย่างน้อย 10 ตัวอักษร';
    const links = parseDriveLines(form.driveLinksText);
    if (links.length === 0)
      errs['driveLinks'] = 'กรุณาวางลิงก์ Google Drive อย่างน้อย 1 รายการ';
    else if (links.length > 10) errs['driveLinks'] = 'แนบลิงก์ได้สูงสุด 10 รายการ';
    else {
      const bad = links.find((l) => !DRIVE_URL_RE.test(l));
      if (bad)
        errs['driveLinks'] =
          'พบลิงก์ที่ไม่ใช่ Google Drive: ' +
          (bad.length > 60 ? bad.slice(0, 57) + '…' : bad);
    }
    if (!form.acknowledged)
      errs['acknowledged'] = 'กรุณายืนยันว่าท่านเป็นเจ้าหน้าที่ของหน่วยงาน';
    return errs;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = clientValidate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const res = await runSubmit({
      organizationName: form.organizationName.trim(),
      staffFullName: form.staffFullName.trim(),
      position: form.position.trim(),
      organizationEmail: form.organizationEmail.trim(),
      contactPhone: form.contactPhone.trim(),
      purpose: form.purpose.trim(),
      driveLinks: parseDriveLines(form.driveLinksText),
    });
    if (!res) return;
    setSubmitted(true);
    setForm(blankForm);
  }

  const submitting = submitState.kind === 'submitting';
  const submitErr = submitState.kind === 'error' ? submitState.error.message : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gov-ink">ขอ API Key เข้าถึงข้อมูลคิว</h1>
        <p className="text-gray-600 mt-1 text-[0.95rem]">
          สำหรับเจ้าหน้าที่ของโรงพยาบาลและหน่วยงานในเครือ เพื่อเรียกใช้ API
          ข้อมูลคิวทั้งระบบ (scope:{' '}
          <code className="font-mono">hospital_write</code>)
        </p>
        {user && (
          <p className="text-sm text-gray-500 mt-2">
            ผู้ยื่นคำขอ: <span className="font-semibold">{user.fullName}</span>{' '}
            ({user.email})
          </p>
        )}
      </header>

      {submitted && (
        <section className="mb-6 border-2 border-gov-ok-ink bg-green-50 p-5">
          <h2 className="text-xl font-bold text-gov-ok-ink mb-2">✓ ส่งคำขอเรียบร้อยแล้ว</h2>
          <p className="text-sm text-gray-700">
            เจ้าหน้าที่จะตรวจสอบเอกสารและส่ง API key ทางอีเมลของหน่วยงานที่ท่านระบุ
            ภายใน 3–5 วันทำการ
          </p>
        </section>
      )}

      <form onSubmit={onSubmit} noValidate className="bg-white border border-gov-border p-6">
        <h2 className="text-xl font-bold mb-1">ขั้นที่ 1 — ข้อมูลเจ้าหน้าที่</h2>
        <p className="text-sm text-gray-600 mb-4">
          ใช้ตรวจสอบว่าท่านเป็นเจ้าหน้าที่ของหน่วยงานที่ได้รับอนุญาตจริง
        </p>

        {submitErr && (
          <div
            role="alert"
            className="mb-4 border-l-[6px] border-gov-err-ink bg-gov-err-bg text-gov-err-ink p-3 text-sm"
          >
            {submitErr}
          </div>
        )}

        <Field
          id="organizationName"
          label="ชื่อโรงพยาบาล / หน่วยงานในเครือ"
          required
          error={fieldErrors['organizationName']}
        >
          <input
            id="organizationName"
            type="text"
            value={form.organizationName}
            disabled={submitting}
            onChange={(e) => set('organizationName', e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-900 focus:border-gov-primary disabled:bg-gray-100"
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            id="staffFullName"
            label="ชื่อ-นามสกุลเจ้าหน้าที่"
            required
            error={fieldErrors['staffFullName']}
          >
            <input
              id="staffFullName"
              type="text"
              value={form.staffFullName}
              disabled={submitting}
              onChange={(e) => set('staffFullName', e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-900 focus:border-gov-primary disabled:bg-gray-100"
            />
          </Field>
          <Field
            id="position"
            label="ตำแหน่ง / แผนก"
            required
            error={fieldErrors['position']}
          >
            <input
              id="position"
              type="text"
              value={form.position}
              disabled={submitting}
              onChange={(e) => set('position', e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-900 focus:border-gov-primary disabled:bg-gray-100"
            />
          </Field>
          <Field
            id="organizationEmail"
            label="อีเมลของหน่วยงาน (ใช้ยืนยัน)"
            required
            error={fieldErrors['organizationEmail']}
          >
            <input
              id="organizationEmail"
              type="email"
              value={form.organizationEmail}
              disabled={submitting}
              onChange={(e) => set('organizationEmail', e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-900 focus:border-gov-primary disabled:bg-gray-100"
            />
          </Field>
          <Field
            id="contactPhone"
            label="เบอร์ติดต่อ"
            required
            error={fieldErrors['contactPhone']}
          >
            <input
              id="contactPhone"
              type="tel"
              value={form.contactPhone}
              disabled={submitting}
              onChange={(e) => set('contactPhone', e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-900 focus:border-gov-primary disabled:bg-gray-100"
            />
          </Field>
        </div>

        <Field
          id="purpose"
          label="วัตถุประสงค์ในการเข้าถึงข้อมูลคิว"
          required
          error={fieldErrors['purpose']}
        >
          <textarea
            id="purpose"
            rows={3}
            value={form.purpose}
            disabled={submitting}
            onChange={(e) => set('purpose', e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-900 focus:border-gov-primary disabled:bg-gray-100"
          />
        </Field>

        <h2 className="text-xl font-bold mt-8 mb-1 pt-4 border-t border-gov-border">
          ขั้นที่ 2 — แนบลิงก์เอกสารยืนยันตัวตนจาก Google Drive
        </h2>
        <p className="text-sm text-gray-600 mb-3">
          อัปโหลดสำเนาบัตรประจำตัวเจ้าหน้าที่ หรือหนังสือมอบหมาย เป็นไฟล์ PDF
          ขึ้น Google Drive แล้ววางลิงก์แชร์ด้านล่าง
        </p>
        <ol className="list-decimal list-inside text-sm text-gray-800 space-y-1 mb-3 ml-1">
          <li>อัปโหลดไฟล์ PDF ขึ้น Google Drive</li>
          <li>
            คลิกขวาที่ไฟล์ → <strong>Share</strong> → เปลี่ยนเป็น{' '}
            <strong>"Anyone with the link — Viewer"</strong>
          </li>
          <li>กด <strong>Copy link</strong> แล้ววางในช่องด้านล่าง</li>
        </ol>

        <Field
          id="driveLinks"
          label="ลิงก์ Google Drive (หนึ่งลิงก์ต่อบรรทัด, สูงสุด 10 ลิงก์)"
          required
          error={fieldErrors['driveLinks']}
        >
          <textarea
            id="driveLinks"
            rows={4}
            value={form.driveLinksText}
            disabled={submitting}
            placeholder={
              'https://drive.google.com/file/d/1AbCdEf…/view?usp=sharing\nhttps://drive.google.com/file/d/2GhIjKl…/view?usp=sharing'
            }
            onChange={(e) => set('driveLinksText', e.target.value)}
            className="w-full px-3 py-2 font-mono text-sm border-2 border-gray-900 focus:border-gov-primary disabled:bg-gray-100"
          />
          <p className="text-xs text-gray-500 mt-1">
            รองรับเฉพาะลิงก์จาก <code className="font-mono">drive.google.com</code>{' '}
            หรือ <code className="font-mono">docs.google.com</code>
          </p>
        </Field>

        <label className="flex items-start gap-2 mt-6 text-sm">
          <input
            type="checkbox"
            checked={form.acknowledged}
            disabled={submitting}
            onChange={(e) => set('acknowledged', e.target.checked)}
            className="mt-1"
          />
          <span>
            ข้าพเจ้ายืนยันว่าเป็นเจ้าหน้าที่ของหน่วยงานข้างต้น
            และจะใช้ข้อมูลคิวตามวัตถุประสงค์ที่ระบุเท่านั้น
          </span>
        </label>
        {fieldErrors['acknowledged'] && (
          <p className="text-sm text-gov-err-ink mt-1">{fieldErrors['acknowledged']}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className="w-full mt-6 px-5 py-3 font-semibold text-white bg-gov-primary border-2 border-gov-primary-dark hover:bg-gov-primary-dark disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? 'กำลังส่งคำขอ…' : 'ส่งคำขอ'}
        </button>
      </form>

      <p className="mt-8 text-sm text-gray-600">
        <Link to="/" className="text-blue-800 hover:underline">
          ← กลับหน้าหลัก
        </Link>
      </p>
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

function Field({ id, label, required, error, children }: FieldProps) {
  return (
    <div className="mb-3">
      <label htmlFor={id} className="block font-semibold mb-1 text-[0.95rem]">
        {label}
        {required && <span className="text-gov-err-ink ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-sm text-gov-err-ink mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

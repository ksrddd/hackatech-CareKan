import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { api } from '@/shared/api/endpoints';
import { ApiError } from '@/shared/api/client';
import { useRequest } from '@/shared/state/useRequest';
import type {
  ApiKeyDto,
  ApiKeyRequestDto,
} from '../../../shared/types';

interface FormFields {
  organizationName: string;
  staffFullName: string;
  position: string;
  organizationEmail: string;
  contactPhone: string;
  referenceNumber: string;
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
  referenceNumber: '',
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

interface VerifyState {
  request: ApiKeyRequestDto;
  apiKey: ApiKeyDto;
  plaintextKey: string;
}

function statusBadgeClass(status: ApiKeyRequestDto['status']): string {
  switch (status) {
    case 'pending_email':
      return 'bg-yellow-100 text-yellow-900 border-yellow-400';
    case 'email_verified':
    case 'approved':
      return 'bg-green-100 text-green-900 border-green-500';
    case 'rejected':
    case 'revoked':
      return 'bg-red-100 text-red-900 border-red-500';
  }
}

const statusLabel: Record<ApiKeyRequestDto['status'], string> = {
  pending_email: 'รอยืนยันอีเมล',
  email_verified: 'ยืนยันอีเมลแล้ว',
  approved: 'อนุมัติแล้ว',
  rejected: 'ถูกปฏิเสธ',
  revoked: 'ถูกเพิกถอน',
};

export function RequestApiKey() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [form, setForm] = useState<FormFields>(blankForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitInfo, setSubmitInfo] = useState<{
    request: ApiKeyRequestDto;
    devVerificationUrl?: string;
  } | null>(null);
  const [verifyState, setVerifyState] = useState<VerifyState | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [myRequests, setMyRequests] = useState<ApiKeyRequestDto[]>([]);
  const [myKeys, setMyKeys] = useState<ApiKeyDto[]>([]);

  const tokenFromUrl = searchParams.get('token');

  function set<K extends keyof FormFields>(key: K, value: FormFields[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  const refresh = useCallback(async () => {
    try {
      const [reqs, keys] = await Promise.all([
        api.listMyApiKeyRequests(),
        api.listMyApiKeys(),
      ]);
      setMyRequests(reqs.requests);
      setMyKeys(keys.apiKeys);
    } catch {
      // Surface only on submit errors; this is a best-effort sidebar refresh.
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // If the user landed here via the email link, auto-redeem the token.
  useEffect(() => {
    if (!tokenFromUrl) return;
    let cancelled = false;
    setVerifying(true);
    setVerifyError(null);
    api
      .verifyApiKeyEmail(tokenFromUrl)
      .then((res) => {
        if (cancelled) return;
        setVerifyState({
          request: res.request,
          apiKey: res.apiKey,
          plaintextKey: res.plaintextKey,
        });
        const next = new URLSearchParams(searchParams);
        next.delete('token');
        setSearchParams(next, { replace: true });
        void refresh();
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg =
          err instanceof ApiError ? err.message : 'ยืนยันอีเมลไม่สำเร็จ';
        setVerifyError(msg);
      })
      .finally(() => {
        if (!cancelled) setVerifying(false);
      });
    return () => {
      cancelled = true;
    };
    // refresh is stable; searchParams ref changes drive this on token removal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenFromUrl]);

  const submitRequest = useCallback(
    (
      _signal: AbortSignal,
      payload: Parameters<typeof api.submitApiKeyRequest>[0],
    ) => api.submitApiKeyRequest(payload),
    [],
  );
  const { state: submitState, run: runSubmit } = useRequest(submitRequest);

  function clientValidate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (form.organizationName.trim().length < 2)
      errs['organizationName'] = 'กรุณาระบุชื่อหน่วยงาน';
    if (form.staffFullName.trim().length < 2)
      errs['staffFullName'] = 'กรุณาระบุชื่อ-นามสกุล';
    if (form.position.trim().length < 2) errs['position'] = 'กรุณาระบุตำแหน่ง';
    if (!/.+@.+\..+/.test(form.organizationEmail))
      errs['organizationEmail'] = 'อีเมลหน่วยงานไม่ถูกต้อง';
    else if (
      /@(gmail|hotmail|outlook|yahoo|icloud|live)\.com$/i.test(
        form.organizationEmail,
      )
    )
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
          'พบลิงก์ที่ไม่ใช่ Google Drive: ' + (bad.length > 60 ? bad.slice(0, 57) + '…' : bad);
    }
    if (!form.acknowledged)
      errs['acknowledged'] = 'กรุณายืนยันว่าท่านเป็นเจ้าหน้าที่ของหน่วยงาน';
    return errs;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setVerifyError(null);
    setVerifyState(null);
    const errs = clientValidate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const res = await runSubmit({
      organizationName: form.organizationName.trim(),
      staffFullName: form.staffFullName.trim(),
      position: form.position.trim(),
      organizationEmail: form.organizationEmail.trim(),
      contactPhone: form.contactPhone.trim(),
      ...(form.referenceNumber.trim()
        ? { referenceNumber: form.referenceNumber.trim() }
        : {}),
      purpose: form.purpose.trim(),
      driveLinks: parseDriveLines(form.driveLinksText),
    });
    if (!res) return;
    setSubmitInfo({
      request: res.request,
      devVerificationUrl: res.devVerificationUrl,
    });
    setForm(blankForm);
    void refresh();
  }

  async function copyKey(plain: string) {
    try {
      await navigator.clipboard.writeText(plain);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore; the textarea below remains selectable
    }
  }

  async function revoke(id: string) {
    try {
      await api.revokeApiKey(id);
      void refresh();
    } catch {
      // surfaced via list refresh
    }
  }

  const submitting = submitState.kind === 'submitting';
  const submitErr =
    submitState.kind === 'error' ? submitState.error.message : null;
  const fieldErrFromServer = useMemo(() => {
    if (submitState.kind !== 'error') return {};
    return submitState.error.details ?? {};
  }, [submitState]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gov-ink">ขอ API Key เข้าถึงข้อมูลคิว</h1>
        <p className="text-gray-600 mt-1 text-[0.95rem]">
          สำหรับเจ้าหน้าที่ของโรงพยาบาลและหน่วยงานในเครือ เพื่อเรียกใช้ API
          ข้อมูลคิวทั้งระบบ (scope: <code className="font-mono">read_queue</code>)
        </p>
        {user && (
          <p className="text-sm text-gray-500 mt-2">
            ผู้ยื่นคำขอ: <span className="font-semibold">{user.fullName}</span>{' '}
            ({user.email})
          </p>
        )}
      </header>

      {verifying && (
        <div className="mb-4 border-l-[6px] border-gov-primary bg-gov-primary-tint text-gov-ink p-3 text-sm">
          กำลังยืนยันอีเมล…
        </div>
      )}
      {verifyError && (
        <div
          role="alert"
          className="mb-4 border-l-[6px] border-gov-err-ink bg-gov-err-bg text-gov-err-ink p-3 text-sm"
        >
          {verifyError}
        </div>
      )}

      {verifyState && (
        <section className="mb-6 border-2 border-gov-ok-ink bg-green-50 p-5">
          <h2 className="text-xl font-bold text-gov-ok-ink mb-2">
            ✓ ยืนยันอีเมลสำเร็จ — นี่คือ API Key ของท่าน
          </h2>
          <p className="text-sm text-gray-700 mb-3">
            <strong>คำเตือน:</strong> คีย์นี้จะแสดงเพียงครั้งเดียว
            กรุณาเก็บไว้ในที่ปลอดภัย เช่น password manager ของหน่วยงาน
            ห้ามแชร์กับผู้อื่น และห้าม commit เข้า repository ของท่าน
          </p>
          <div className="flex flex-wrap gap-2 items-stretch">
            <textarea
              readOnly
              value={verifyState.plaintextKey}
              rows={2}
              className="flex-1 min-w-[260px] font-mono text-sm p-2 border-2 border-gov-ok-ink bg-white"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              onClick={() => void copyKey(verifyState.plaintextKey)}
              className="px-4 py-2 font-semibold text-white bg-gov-primary border-2 border-gov-primary-dark hover:bg-gov-primary-dark"
            >
              {copied ? 'คัดลอกแล้ว ✓' : 'คัดลอก'}
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-3">
            ใช้ใน header ของ HTTP request เป็น{' '}
            <code className="font-mono">x-api-key: {verifyState.apiKey.prefix}…</code>
          </p>

          <div className="mt-4 pt-3 border-t border-green-300 flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-gray-700">
              📄 บันทึกสำเนาคำขอเป็น Excel (เก็บไว้เป็นหลักฐานของหน่วยงาน)
            </p>
            <button
              type="button"
              onClick={() => {
                void api
                  .downloadMyApiKeyRequestExcel(verifyState.request.id)
                  .catch((err: unknown) => {
                    setVerifyError(
                      err instanceof Error ? err.message : 'ดาวน์โหลดไฟล์ไม่สำเร็จ',
                    );
                  });
              }}
              className="px-3 py-2 text-sm font-semibold text-gov-primary bg-white border-2 border-gov-primary hover:bg-gov-primary-tint"
            >
              ⬇ ดาวน์โหลด Excel
            </button>
          </div>
        </section>
      )}

      {submitInfo && !verifyState && (
        <section className="mb-6 border-2 border-yellow-500 bg-yellow-50 p-5">
          <h2 className="text-xl font-bold text-yellow-900 mb-2">
            ส่งคำขอเรียบร้อย — รอยืนยันอีเมล
          </h2>
          <p className="text-sm text-gray-800">
            เราส่งลิงก์ยืนยันไปยัง{' '}
            <strong>{submitInfo.request.organizationEmail}</strong>{' '}
            กรุณาเปิดอีเมลและคลิกลิงก์เพื่อรับ API key
            ลิงก์จะหมดอายุภายใน 24 ชั่วโมง
          </p>
          {submitInfo.devVerificationUrl && (
            <div className="mt-3 border border-gov-border bg-white p-3 text-xs text-gray-700">
              <p className="font-semibold mb-1">
                [โหมดทดสอบ] ลิงก์ยืนยัน (จริง ๆ ต้องส่งทางอีเมลเท่านั้น):
              </p>
              <a
                href={submitInfo.devVerificationUrl}
                className="font-mono break-all text-blue-800 hover:underline"
              >
                {submitInfo.devVerificationUrl}
              </a>
            </div>
          )}
        </section>
      )}

      <form
        onSubmit={onSubmit}
        noValidate
        className="bg-white border border-gov-border p-6"
      >
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
          error={fieldErrors['organizationName'] ?? fieldErrFromServer['organizationName']}
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
            error={fieldErrors['staffFullName'] ?? fieldErrFromServer['staffFullName']}
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
            error={fieldErrors['position'] ?? fieldErrFromServer['position']}
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
            error={
              fieldErrors['organizationEmail'] ?? fieldErrFromServer['organizationEmail']
            }
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
            error={fieldErrors['contactPhone'] ?? fieldErrFromServer['contactPhone']}
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
          id="referenceNumber"
          label="เลขที่หนังสือ / เอกสารอ้างอิง (ถ้ามี)"
        >
          <input
            id="referenceNumber"
            type="text"
            value={form.referenceNumber}
            disabled={submitting}
            onChange={(e) => set('referenceNumber', e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-900 focus:border-gov-primary disabled:bg-gray-100"
          />
        </Field>

        <Field
          id="purpose"
          label="วัตถุประสงค์ในการเข้าถึงข้อมูลคิว"
          required
          error={fieldErrors['purpose'] ?? fieldErrFromServer['purpose']}
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
          แนบ <strong>เอกสารยืนยันตัวตนของเจ้าหน้าที่</strong> (เช่น
          สำเนาบัตรประจำตัวเจ้าหน้าที่ หรือหนังสือมอบหมาย) โดยอัปโหลดไฟล์
          PDF ขึ้น Google Drive ของท่านก่อน แล้ววางลิงก์แชร์ในช่องด้านล่าง —
          ระบบจะออก API key ให้ก็ต่อเมื่อเจ้าหน้าที่ตรวจสอบเอกสารและยืนยันแล้วเท่านั้น
        </p>
        <ol className="list-decimal list-inside text-sm text-gray-800 space-y-1 mb-3 ml-1">
          <li>อัปโหลดไฟล์ PDF เอกสารยืนยันตัวตนขึ้น Google Drive ของท่าน</li>
          <li>
            คลิกขวาที่ไฟล์ → <strong>Share / แชร์</strong> → เปลี่ยน
            “Restricted” เป็น{' '}
            <strong>“Anyone with the link — Viewer”</strong> (ทุกคนที่มีลิงก์ดูได้)
          </li>
          <li>กดปุ่ม <strong>Copy link</strong> แล้ววางลิงก์ในช่องด้านล่าง</li>
        </ol>

        <Field
          id="driveLinks"
          label="ลิงก์ Google Drive (หนึ่งลิงก์ต่อบรรทัด, สูงสุด 10 ลิงก์)"
          required
          error={
            fieldErrors['driveLinks'] ??
            fieldErrFromServer['driveLinks'] ??
            fieldErrFromServer['driveLinks.0']
          }
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
            ข้าพเจ้ายืนยันว่าเป็นเจ้าหน้าที่ของหน่วยงานข้างต้น และจะใช้ข้อมูลคิว
            ตามวัตถุประสงค์ที่ระบุเท่านั้น
            หากตรวจพบการใช้งานผิดวัตถุประสงค์ คีย์จะถูกเพิกถอนทันที
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
          {submitting ? 'กำลังส่งคำขอ…' : 'ส่งคำขอและรับลิงก์ยืนยันทางอีเมล'}
        </button>
      </form>

      {(myRequests.length > 0 || myKeys.length > 0) && (
        <section className="mt-8">
          <h2 className="text-2xl font-bold mb-3">คำขอและคีย์ของฉัน</h2>
          {myRequests.length > 0 && (
            <ul className="space-y-2 mb-6">
              {myRequests.map((r) => (
                <li
                  key={r.id}
                  className="border border-gov-border bg-white p-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold">{r.organizationName}</p>
                    <p className="text-xs text-gray-600">
                      {new Date(r.createdAt).toLocaleString('th-TH')} ·{' '}
                      {r.driveLinks.length} ลิงก์
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold border ${statusBadgeClass(
                      r.status,
                    )}`}
                  >
                    {statusLabel[r.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {myKeys.length > 0 && (
            <ul className="space-y-2">
              {myKeys.map((k) => (
                <li
                  key={k.id}
                  className="border border-gov-border bg-white p-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-mono text-sm">{k.prefix}…</p>
                    <p className="text-xs text-gray-600">
                      {k.organizationName} · scope: {k.scope} ·{' '}
                      {k.revokedAt
                        ? `เพิกถอน ${new Date(k.revokedAt).toLocaleDateString('th-TH')}`
                        : k.lastUsedAt
                          ? `ใช้ล่าสุด ${new Date(k.lastUsedAt).toLocaleString('th-TH')}`
                          : 'ยังไม่ถูกใช้งาน'}
                    </p>
                  </div>
                  {!k.revokedAt && (
                    <button
                      type="button"
                      onClick={() => void revoke(k.id)}
                      className="px-3 py-1 text-sm text-gov-err-ink border border-gov-err-ink hover:bg-gov-err-bg"
                    >
                      เพิกถอน
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

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
      <label
        htmlFor={id}
        className="block font-semibold mb-1 text-[0.95rem]"
      >
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

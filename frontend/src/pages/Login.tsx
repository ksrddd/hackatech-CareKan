import { useCallback, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Announcement } from '@/components/Announcement';
import { useAuth } from '@/lib/auth';
import { ANNOUNCEMENTS } from '@/lib/mockData';
import { useRequest } from '@/shared/state/useRequest';
import type { User } from '@/lib/types';

interface LocationState {
  from?: string;
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const [cid, setCid] = useState('');
  const [pwd, setPwd] = useState('');

  // Wrap the auth call. useRequest gives us {state, run} with a typed
  // discriminated union, plus AbortController-backed cleanup so a fast
  // route change doesn't fire setState on an unmounted form.
  const loginRequest = useCallback(
    (_signal: AbortSignal, nationalId: string, password: string): Promise<User> =>
      login(nationalId, password),
    [login],
  );
  const { state: loginState, run } = useRequest(loginRequest);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void (async () => {
      const user = await run(cid, pwd);
      if (!user) return;
      const target =
        state?.from && state.from !== '/login'
          ? state.from
          : user.role === 'admin'
            ? '/admin'
            : '/my-appointments';
      navigate(target, { replace: true });
    })();
  }

  const submitting = loginState.kind === 'submitting';
  const error = loginState.kind === 'error' ? loginState.error.message : null;

  return (
    <>
      <div className="max-w-[460px] mx-auto my-12 bg-white border border-gov-border p-8">
        <img
          src="/carekan-logo.jpg"
          alt="CareKan — แคร์กัน"
          width={120}
          height={64}
          className="h-16 w-auto mx-auto mb-4 object-contain"
        />
        <h1 className="text-2xl font-bold mb-1 text-center">เข้าสู่ระบบ</h1>
        <p className="text-gray-600 mb-6 text-[0.95rem] text-center">
          ใช้เลขบัตรประจำตัวประชาชน 13 หลัก เพื่อตรวจสอบหรือจองคิวโรงพยาบาลรัฐในสังกัด กทม.
        </p>

        <form onSubmit={onSubmit} noValidate>
          {error && (
            <div
              role="alert"
              className="mb-4 border-l-[6px] border-gov-err-ink bg-gov-err-bg text-gov-err-ink p-3 text-sm"
            >
              {error}
            </div>
          )}
          <div className="mb-4">
            <label htmlFor="cid" className="block font-semibold mb-1 text-[0.95rem]">
              เลขบัตรประจำตัวประชาชน
            </label>
            <span className="block text-sm text-gray-500 mb-1">
              กรอกตัวเลข 13 หลัก โดยไม่ต้องใส่ขีด
            </span>
            <input
              id="cid"
              name="cid"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{13}"
              maxLength={13}
              autoComplete="username"
              required
              disabled={submitting}
              value={cid}
              onChange={(e) => setCid(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3 py-2 border-2 border-gray-900 rounded-none focus:border-gov-primary disabled:bg-gray-100"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="pwd" className="block font-semibold mb-1 text-[0.95rem]">
              รหัสผ่าน
            </label>
            <input
              id="pwd"
              name="pwd"
              type="password"
              autoComplete="current-password"
              required
              disabled={submitting}
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-900 rounded-none focus:border-gov-primary disabled:bg-gray-100"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            className="w-full mt-2 px-5 py-3 font-semibold text-white bg-gov-primary border-2 border-gov-primary-dark hover:bg-gov-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gov-border text-[0.9rem]">
          <p>
            <Link to="/register" className="text-blue-800 hover:underline">
              ลงทะเบียนผู้ใช้ใหม่
            </Link>
            <span className="mx-2 text-gray-400">|</span>
            <a href="#" className="text-blue-800 hover:underline">
              ลืมรหัสผ่าน
            </a>
          </p>
        </div>

        <details className="mt-5 text-sm border border-gov-border p-3 bg-gray-50">
          <summary className="cursor-pointer font-semibold text-gov-ink">
            บัญชี demo สำหรับ Hackathon
          </summary>
          <div className="mt-2 space-y-1 text-gray-700">
            <p>
              ผู้ใช้ทั่วไป: <code className="font-mono">1234567890123</code> · รหัสใดก็ได้ ≥ 4 ตัวอักษร
            </p>
            <p>
              เจ้าหน้าที่: <code className="font-mono">9876543210987</code> · รหัสใดก็ได้ ≥ 4 ตัวอักษร
            </p>
          </div>
        </details>
      </div>

      <div className="max-w-[720px] mx-auto px-4 mb-8">
        <Announcement title="ประกาศ">{ANNOUNCEMENTS.loginNotice}</Announcement>
      </div>
    </>
  );
}

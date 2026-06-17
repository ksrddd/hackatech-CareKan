import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';

type Step = 1 | 2 | 3 | 4;

interface FormState {
  acceptedPdpa: boolean;
  cid: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  sex: 'male' | 'female' | 'unspecified';
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const initial: FormState = {
  acceptedPdpa: false,
  cid: '',
  firstName: '',
  lastName: '',
  birthDate: '',
  sex: 'male',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
};

interface StepHeaderProps {
  step: Step;
}

function StepHeader({ step }: StepHeaderProps) {
  const steps = [
    { n: 1, label: 'PDPA' },
    { n: 2, label: 'ข้อมูลส่วนตัว' },
    { n: 3, label: 'ติดต่อ' },
    { n: 4, label: 'รหัสผ่าน' },
  ] as const;
  return (
    <ol className="flex items-center justify-between mb-6 border-b border-gov-border pb-3">
      {steps.map((s, i) => {
        const done = s.n < step;
        const active = s.n === step;
        const badge = done
          ? 'bg-gov-ok-ink text-white border-gov-ok-ink'
          : active
            ? 'bg-gov-primary text-white border-gov-primary-dark'
            : 'bg-white text-gray-500 border-gray-300';
        const text = done
          ? 'text-gov-ok-ink'
          : active
            ? 'text-gov-primary'
            : 'text-gray-500';
        return (
          <Sep key={s.n} last={i === steps.length - 1}>
            <li className="flex items-center gap-2">
              <span
                className={`w-7 h-7 grid place-items-center font-bold text-sm border-2 ${badge}`}
              >
                {done ? '✓' : s.n}
              </span>
              <span className={`text-sm font-semibold ${text}`}>{s.label}</span>
            </li>
          </Sep>
        );
      })}
    </ol>
  );
}

function Sep({ last, children }: { last: boolean; children: ReactNode }) {
  return (
    <>
      {children}
      {!last && <span className="flex-1 h-[2px] bg-gray-300 mx-2" />}
    </>
  );
}

export function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(initial);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function next(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (step === 1 && !form.acceptedPdpa) {
      setError('โปรดยอมรับเงื่อนไขการคุ้มครองข้อมูลส่วนบุคคลก่อนดำเนินการต่อ');
      return;
    }
    if (step === 2) {
      if (!/^\d{13}$/.test(form.cid)) {
        setError('เลขบัตรประจำตัวประชาชนต้องเป็นตัวเลข 13 หลัก');
        return;
      }
      if (!form.firstName || !form.lastName) {
        setError('โปรดกรอกชื่อและนามสกุล');
        return;
      }
      if (!form.birthDate) {
        setError('โปรดเลือกวันเดือนปีเกิด');
        return;
      }
    }
    if (step === 3 && !/^[0-9-]{9,12}$/.test(form.phone)) {
      setError('โปรดกรอกเบอร์โทรศัพท์ที่ถูกต้อง');
      return;
    }
    if (step === 4) {
      if (form.password.length < 8) {
        setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError('รหัสผ่านและการยืนยันไม่ตรงกัน');
        return;
      }
      // Mock-only: send to login (no backend yet)
      navigate('/login', {
        replace: true,
        state: { registeredCid: form.cid },
      });
      return;
    }
    setStep((s) => ((s + 1) as Step));
  }

  function back() {
    setError(null);
    if (step === 1) navigate(-1);
    else setStep((s) => ((s - 1) as Step));
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-12">
      <p className="text-sm text-gray-500 mb-2">
        <Link to="/" className="text-blue-800 hover:underline">
          หน้าหลัก
        </Link>{' '}
        › สมัครใช้งาน
      </p>
      <h1 className="text-2xl font-bold mb-1">สมัครใช้งาน CareKan</h1>
      <p className="text-gray-600 mb-6">
        ใช้เลขบัตรประจำตัวประชาชน 13 หลักเพื่อยืนยันตัวตน ขั้นตอนทั้งหมด 4 ขั้น ใช้เวลาประมาณ 3 นาที
      </p>

      <StepHeader step={step} />

      <section className="bg-white border border-gov-border p-6">
        <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
          ขั้นที่ {step} จาก 4
        </p>

        <form onSubmit={next} noValidate className="space-y-4">
          {error && (
            <div className="border-l-[6px] border-gov-err-ink bg-gov-err-bg text-gov-err-ink p-3 text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <>
              <h2 className="text-xl font-bold mb-1">ความยินยอม PDPA</h2>
              <p className="text-gray-700 text-sm mb-3">
                ระบบเก็บเฉพาะข้อมูลที่จำเป็นต่อการจองคิว (ชื่อ–นามสกุล เลข ปชช. เบอร์โทร อีเมล)
                และไม่จัดเก็บข้อมูลทางการแพทย์ที่อ่อนไหวในรุ่นต้นแบบ
                การเข้าถึงข้อมูลส่วนตัวต้องมีการยืนยันตัวตนทุกครั้ง
                (สอดคล้อง พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล)
              </p>
              <label className="flex gap-3 items-start border border-gov-border p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.acceptedPdpa}
                  onChange={(e) => set('acceptedPdpa', e.target.checked)}
                  className="mt-1"
                />
                <span>
                  ข้าพเจ้ายินยอมให้ระบบ CareKan เก็บและประมวลผลข้อมูลส่วนบุคคลข้างต้นเพื่อให้บริการนัดหมายโรงพยาบาลรัฐในสังกัด กทม.
                </span>
              </label>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-bold mb-1">ข้อมูลส่วนตัว</h2>
              <div>
                <label htmlFor="cid" className="block font-semibold mb-1">
                  เลขบัตรประจำตัวประชาชน <span className="text-gov-err-ink">*</span>
                </label>
                <span className="block text-sm text-gray-500 mb-1">
                  กรอก 13 หลัก โดยไม่ต้องใส่ขีด
                </span>
                <input
                  id="cid"
                  type="text"
                  inputMode="numeric"
                  maxLength={13}
                  value={form.cid}
                  onChange={(e) =>
                    set('cid', e.target.value.replace(/\D/g, ''))
                  }
                  className="w-full px-3 py-2 border-2 border-gray-900 rounded-none focus:border-gov-primary"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fname" className="block font-semibold mb-1">
                    ชื่อ (ภาษาไทย) <span className="text-gov-err-ink">*</span>
                  </label>
                  <input
                    id="fname"
                    type="text"
                    value={form.firstName}
                    onChange={(e) => set('firstName', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-900 rounded-none focus:border-gov-primary"
                  />
                </div>
                <div>
                  <label htmlFor="lname" className="block font-semibold mb-1">
                    นามสกุล <span className="text-gov-err-ink">*</span>
                  </label>
                  <input
                    id="lname"
                    type="text"
                    value={form.lastName}
                    onChange={(e) => set('lastName', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-900 rounded-none focus:border-gov-primary"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-[1fr_180px] gap-4">
                <div>
                  <label htmlFor="dob" className="block font-semibold mb-1">
                    วันเดือนปีเกิด <span className="text-gov-err-ink">*</span>
                  </label>
                  <input
                    id="dob"
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => set('birthDate', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-900 rounded-none focus:border-gov-primary"
                  />
                </div>
                <div>
                  <label htmlFor="sex" className="block font-semibold mb-1">
                    เพศ
                  </label>
                  <select
                    id="sex"
                    value={form.sex}
                    onChange={(e) =>
                      set('sex', e.target.value as FormState['sex'])
                    }
                    className="w-full px-3 py-2 border-2 border-gray-900 rounded-none focus:border-gov-primary"
                  >
                    <option value="male">ชาย</option>
                    <option value="female">หญิง</option>
                    <option value="unspecified">ไม่ระบุ</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-xl font-bold mb-1">ข้อมูลติดต่อ</h2>
              <div>
                <label htmlFor="phone" className="block font-semibold mb-1">
                  เบอร์โทรศัพท์ <span className="text-gov-err-ink">*</span>
                </label>
                <span className="block text-sm text-gray-500 mb-1">
                  เช่น 081-234-5678
                </span>
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-900 rounded-none focus:border-gov-primary"
                />
              </div>
              <div>
                <label htmlFor="email" className="block font-semibold mb-1">
                  อีเมล
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-900 rounded-none focus:border-gov-primary"
                />
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="text-xl font-bold mb-1">ตั้งรหัสผ่าน</h2>
              <p className="text-gray-600 text-sm mb-3">
                ใช้รหัสผ่านอย่างน้อย 8 ตัวอักษร แนะนำให้ใช้ตัวอักษรและตัวเลขผสมกัน
              </p>
              <div>
                <label htmlFor="pwd" className="block font-semibold mb-1">
                  รหัสผ่าน <span className="text-gov-err-ink">*</span>
                </label>
                <input
                  id="pwd"
                  type="password"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-900 rounded-none focus:border-gov-primary"
                />
              </div>
              <div>
                <label htmlFor="cpwd" className="block font-semibold mb-1">
                  ยืนยันรหัสผ่าน <span className="text-gov-err-ink">*</span>
                </label>
                <input
                  id="cpwd"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => set('confirmPassword', e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-900 rounded-none focus:border-gov-primary"
                />
              </div>
            </>
          )}

          <div className="bg-gov-wait-bg border-l-[6px] border-gov-wait-ink px-3 py-2 text-sm">
            <strong>ความเป็นส่วนตัว:</strong>{' '}
            ระบบจะไม่เปิดเผยข้อมูลของท่านต่อหน่วยงานอื่น
            นอกจากโรงพยาบาลในเครือ กทม. ที่ท่านจองคิว
          </div>

          <div className="flex justify-between pt-3 border-t border-gov-border">
            <button
              type="button"
              onClick={back}
              className="px-5 py-2 font-semibold text-gray-700 bg-white border-2 border-gray-400 hover:bg-gray-100"
            >
              ย้อนกลับ
            </button>
            <button
              type="submit"
              className="px-6 py-2 font-semibold text-white bg-gov-primary border-2 border-gov-primary-dark hover:bg-gov-primary-dark"
            >
              {step === 4 ? 'สมัครและเข้าสู่ระบบ' : 'ถัดไป →'}
            </button>
          </div>
        </form>
      </section>

      <p className="text-sm text-center text-gray-500 mt-5">
        มีบัญชีอยู่แล้ว?{' '}
        <Link to="/login" className="text-blue-800 hover:underline font-semibold">
          เข้าสู่ระบบ
        </Link>
      </p>
    </div>
  );
}

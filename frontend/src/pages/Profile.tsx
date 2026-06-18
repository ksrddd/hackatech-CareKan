import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useHospital } from '@/lib/hospitals';
import {
  ageFromBirth,
  formatBuddhistDate,
  maskNationalId,
} from '@/lib/format';
import { insuranceRightLabel, type Sex } from '@/lib/types';

const sexLabel: Record<Sex, string> = {
  male: 'ชาย',
  female: 'หญิง',
  unspecified: 'ไม่ระบุ',
};

const roleLabel: Record<'citizen' | 'admin', string> = {
  citizen: 'ผู้ใช้ทั่วไป (Citizen)',
  admin: 'เจ้าหน้าที่ (Admin)',
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gov-border p-3 bg-gray-50">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-[0.95rem] font-medium text-gov-ink break-words">
        {value || '—'}
      </div>
    </div>
  );
}

export function Profile() {
  const { user, logout } = useAuth();
  const { state: hospitalState } = useHospital(user?.primaryHospitalId ?? '');

  if (!user) return <Navigate to="/login" replace />;

  const age = ageFromBirth(user.birthDate);
  const initials = user.fullName.trim().charAt(0) || '?';
  const primaryHospitalName =
    user.primaryHospitalId == null
      ? 'ยังไม่ได้เลือก'
      : hospitalState.kind === 'success'
        ? hospitalState.data.hospital.shortName
        : hospitalState.kind === 'error'
          ? user.primaryHospitalId
          : 'กำลังโหลด…';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-12">
      <p className="text-sm text-gray-500 mb-3">
        <Link to="/" className="text-blue-800 hover:underline">
          หน้าหลัก
        </Link>{' '}
        › บัญชีของฉัน
      </p>

      <section className="bg-white border-2 border-gov-ink p-5 mb-5">
        <div className="flex gap-4 flex-wrap items-center">
          <div className="w-20 h-20 grid place-items-center bg-gov-primary text-white font-bold text-3xl border-2 border-gov-primary-dark">
            {initials}
          </div>
          <div className="flex-1 min-w-[240px]">
            <h1 className="text-2xl font-bold mb-1">{user.fullName}</h1>
            <p className="text-sm text-gray-600">
              {maskNationalId(user.nationalId)} · อายุ {age} ปี
            </p>
            <p className="text-sm mt-2">
              <span className="inline-block bg-gov-ok-bg text-gov-ok-ink px-2 py-0.5 border border-gov-ok-ink font-semibold text-xs">
                {roleLabel[user.role]}
              </span>
            </p>
          </div>
          <div className="text-right min-w-[180px]">
            <button
              type="button"
              onClick={logout}
              className="w-full px-4 py-2 text-sm font-semibold text-gov-err-ink bg-white border-2 border-gov-err-ink hover:bg-gov-err-bg"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-5">
        <section className="bg-white border border-gov-border p-5">
          <h2 className="text-lg font-semibold pb-2 mb-3 border-b border-gov-border">
            ข้อมูลส่วนตัว
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="ชื่อ–นามสกุล" value={user.fullName} />
            <Field
              label="เลขประจำตัวประชาชน"
              value={maskNationalId(user.nationalId)}
            />
            <Field
              label="วัน เดือน ปีเกิด"
              value={formatBuddhistDate(user.birthDate)}
            />
            <Field label="อายุ" value={`${age} ปี`} />
            <Field label="เพศ" value={sexLabel[user.sex]} />
          </div>
        </section>

        <section className="bg-white border border-gov-border p-5">
          <h2 className="text-lg font-semibold pb-2 mb-3 border-b border-gov-border">
            ข้อมูลติดต่อ
          </h2>
          <div className="grid sm:grid-cols-1 gap-3">
            <Field label="เบอร์โทรศัพท์" value={user.phone} />
            <Field label="อีเมล" value={user.email} />
          </div>
        </section>

        <section className="bg-white border border-gov-border p-5">
          <h2 className="text-lg font-semibold pb-2 mb-3 border-b border-gov-border">
            สิทธิการรักษาและโรงพยาบาลประจำ
          </h2>
          <div className="grid sm:grid-cols-1 gap-3">
            <Field
              label="สิทธิการรักษา"
              value={insuranceRightLabel[user.insuranceRight]}
            />
            <Field label="โรงพยาบาลประจำ" value={primaryHospitalName} />
            <Field
              label="รหัสผู้ป่วยในโรงพยาบาล (HN)"
              value={user.hospitalPatientId ?? 'ยังไม่ได้กำหนด'}
            />
          </div>
        </section>

        <section className="bg-white border border-gov-border p-5">
          <h2 className="text-lg font-semibold pb-2 mb-3 border-b border-gov-border">
            ข้อมูลบัญชี
          </h2>
          <div className="grid sm:grid-cols-1 gap-3">
            <Field
              label="สมัครเมื่อ"
              value={formatBuddhistDate(user.createdAt)}
            />
            <Field
              label="ให้ความยินยอม PDPA"
              value={
                user.consentAt
                  ? formatBuddhistDate(user.consentAt)
                  : 'ยังไม่ได้ให้ความยินยอม'
              }
            />
          </div>
          <p className="text-xs text-gray-500 mt-4 pt-3 border-t border-gov-border">
            หากต้องการแก้ไขข้อมูลส่วนตัว เช่น เบอร์โทร อีเมล หรือที่อยู่ —
            กรุณาติดต่อเจ้าหน้าที่หรือใช้ฟีเจอร์ "แก้ไขข้อมูล" ในเวอร์ชันถัดไป
          </p>
        </section>
      </div>
    </div>
  );
}

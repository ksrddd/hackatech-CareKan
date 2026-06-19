import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useLiff } from '@/lib/liff';
import { BookingStepper } from '@/components/BookingStepper';
import { DateGrid } from '@/components/DateGrid';
import { TimeSlotGrid } from '@/components/TimeSlotGrid';
import { useAuth } from '@/lib/auth';
import { useCreateAppointment } from '@/lib/appointments';
import {
  formatBuddhistDate,
  formatTimeRange,
} from '@/lib/format';
import { useHospital, useHospitals } from '@/lib/hospitals';
import {
  serviceTypeLabel,
  type ServiceType,
  type TimeSlot,
} from '@/lib/types';

type Step = 1 | 2 | 3;

const PURPOSE_OPTIONS: { value: ServiceType; icon: React.ReactNode; description: string }[] = [
  {
    value: 'opd',
    icon: <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="9"/><path d="M11 7v8M7 11h8"/></svg>,
    description: 'ฉันมีอาการบางอย่าง อยากให้แพทย์ตรวจ',
  },
  {
    value: 'new_patient',
    icon: <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 2 17.5V19"/><circle cx="8.5" cy="7" r="3.5"/><path d="M17 8v6M14 11h6"/></svg>,
    description: 'ครั้งแรกที่มา รพ. นี้',
  },
  {
    value: 'follow_up',
    icon: <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="9"/><path d="M11 6v5l3 3"/></svg>,
    description: 'ตามที่หมอเคยนัดไว้',
  },
  {
    value: 'checkup',
    icon: <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M19.07 4.93a10 10 0 1 0 0 14.14"/><path d="M12 8v4l2 2"/></svg>,
    description: 'ตรวจร่างกาย / ตรวจเลือดประจำปี',
  },
  {
    value: 'medication',
    icon: <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M10.5 20.5 3.5 13.5a5 5 0 0 1 7.07-7.07l7 7a5 5 0 0 1-7.07 7.07z"/><line x1="8.5" y1="13.5" x2="13.5" y2="8.5"/></svg>,
    description: 'รับยาเรื้อรังที่หมอสั่งไว้',
  },
  {
    value: 'lab',
    icon: <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v8l-4 6a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-4-6V2"/><line x1="6" y1="2" x2="16" y2="2"/><path d="M6 14h10"/></svg>,
    description: 'ตรวจเลือดหรือผลแลป',
  },
];

export function BookAppointment() {
  const { user } = useAuth();
  const liff = useLiff();
  const [search] = useSearchParams();
  const create = useCreateAppointment();
  const navigate = useNavigate();

  const { state: hospitalsState } = useHospitals({});

  // Determine the initial hospitalId from URL param; fall back once hospitals load
  const urlHospital = search.get('hospital');

  const [step, setStep] = useState<Step>(1);
  const [hospitalId, setHospitalId] = useState<string>(urlHospital ?? '');
  const [purpose, setPurpose] = useState<ServiceType>('follow_up');
  const [reason, setReason] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Set hospitalId to first hospital once loaded (if not supplied by URL)
  useEffect(() => {
    if (!hospitalId && hospitalsState.kind === 'success' && hospitalsState.data.length > 0) {
      const first = hospitalsState.data[0];
      if (first) setHospitalId(first.id);
    }
  }, [hospitalId, hospitalsState]);

  const { state: hospitalDetailState } = useHospital(hospitalId);

  const hospitals = hospitalsState.kind === 'success' ? hospitalsState.data : [];
  const hospital =
    hospitalDetailState.kind === 'success' ? hospitalDetailState.data.hospital : null;

  useEffect(() => {
    setSelectedDate(null);
    setSelectedSlot(null);
  }, [hospitalId]);

  function goNext() {
    setError(null);
    if (step === 1) {
      if (!hospitalId) {
        setError('โปรดเลือกโรงพยาบาล');
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!selectedDate || !selectedSlot) {
        setError('โปรดเลือกวันและช่วงเวลา');
        return;
      }
      setStep(3);
      return;
    }
  }

  async function confirm() {
    if (!user || !selectedDate || !selectedSlot || !hospitalId) return;
    setError(null);
    const appt = await create.run({
      hospitalId,
      purpose,
      reason,
      slotId: selectedSlot.id,
      date: selectedDate,
    });
    if (appt) navigate(`/book/success/${appt.id}`);
  }

  if (!user) return <Navigate to="/login" replace />;

  const submitting = create.state.kind === 'submitting';

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-12">
      <p className="text-sm text-gray-500 mb-2">
        <Link to="/my-appointments" className="text-blue-800 hover:underline">
          นัดหมายของฉัน
        </Link>{' '}
        › จองคิวใหม่
      </p>
      <h1 className="text-2xl font-bold mb-4">จองคิวนัดหมาย</h1>

      {liff.isInLiff && liff.profile && (
        <div className="mb-4 flex items-center gap-3 bg-[#06C755]/10 border border-[#06C755]/30 px-4 py-3">
          {liff.profile.pictureUrl && (
            <img
              src={liff.profile.pictureUrl}
              alt={liff.profile.displayName}
              className="w-10 h-10 rounded-full shrink-0"
            />
          )}
          <div>
            <p className="text-sm font-semibold text-[#06C755]">เข้าสู่ระบบผ่าน LINE</p>
            <p className="text-sm text-gray-700">สวัสดี, {liff.profile.displayName}</p>
          </div>
        </div>
      )}

      <BookingStepper
        steps={[
          { label: 'เลือกโรงพยาบาล' },
          { label: 'เลือกวันและเวลา' },
          { label: 'ตรวจสอบและยืนยัน' },
        ]}
        currentStep={step}
      />

      {error && (
        <div className="mb-4 border-l-[6px] border-gov-err-ink bg-gov-err-bg text-gov-err-ink p-3 text-sm">
          {error}
        </div>
      )}
      {create.state.kind === 'error' && (
        <div className="mb-4 border-l-[6px] border-gov-err-ink bg-gov-err-bg text-gov-err-ink p-3 text-sm">
          {create.state.error.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div>
          {step === 1 && (
            <>
              {urlHospital ? (
                <section className="bg-white border-2 border-gov-ink p-5 mb-5">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-gov-border">
                    <h2 className="text-lg font-semibold">โรงพยาบาลที่จอง</h2>
                    <Link
                      to="/search"
                      className="text-sm text-blue-800 hover:underline"
                    >
                      เปลี่ยนโรงพยาบาล
                    </Link>
                  </div>
                  {hospital ? (
                    <div>
                      <strong className="block text-lg">
                        {hospital.shortName}
                      </strong>
                      <p className="text-sm text-gray-600 mt-1">
                        {hospital.address}
                      </p>
                    </div>
                  ) : hospitalDetailState.kind === 'error' ? (
                    <p className="text-sm text-gov-err-ink">
                      ไม่พบโรงพยาบาลที่เลือก —{' '}
                      <Link to="/search" className="text-blue-800 hover:underline">
                        เลือกโรงพยาบาลใหม่
                      </Link>
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">กำลังโหลด…</p>
                  )}
                </section>
              ) : (
                <section className="bg-white border border-gov-border p-5 mb-5">
                  <h2 className="text-lg font-semibold pb-2 mb-3 border-b border-gov-border">
                    เลือกโรงพยาบาล
                  </h2>
                  {hospitalsState.kind === 'submitting' && (
                    <p className="text-sm text-gray-500">กำลังโหลด…</p>
                  )}
                  {hospitalsState.kind === 'error' && (
                    <p className="text-sm text-gov-err-ink">
                      โหลดรายชื่อโรงพยาบาลไม่สำเร็จ:{' '}
                      {hospitalsState.error.message}
                    </p>
                  )}
                  {hospitalsState.kind === 'success' && (
                    <ul className="grid gap-2 list-none p-0 m-0">
                      {hospitals.map((h) => {
                        const selected = h.id === hospitalId;
                        return (
                          <li key={h.id}>
                            <label
                              className={`flex gap-3 items-start border-2 p-3 cursor-pointer transition-colors ${
                                selected
                                  ? 'border-gov-primary bg-gov-primary-tint'
                                  : 'border-gov-border bg-white hover:border-gov-primary hover:bg-gov-primary-tint'
                              }`}
                            >
                              <input
                                type="radio"
                                name="hospital"
                                checked={selected}
                                onChange={() => setHospitalId(h.id)}
                                className="mt-1 scale-110 accent-gov-primary"
                              />
                              <span>
                                <span className="block font-semibold">
                                  {h.shortName}
                                </span>
                                <span className="block text-sm text-gray-600 mt-0.5">
                                  {h.address} · ห่าง{' '}
                                  {h.mockDistanceKm.toFixed(1)} กม.
                                </span>
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              )}

              <section className="bg-white border border-gov-border p-5 mb-5">
                <h2 className="text-lg font-semibold pb-2 mb-3 border-b border-gov-border">
                  วัตถุประสงค์
                </h2>
                <div className="grid sm:grid-cols-2 gap-3 mb-4">
                  {PURPOSE_OPTIONS.map((opt) => {
                    const selected = opt.value === purpose;
                    return (
                      <label key={opt.value} className="cursor-pointer">
                        <input
                          type="radio"
                          name="purpose"
                          value={opt.value}
                          checked={selected}
                          onChange={() => setPurpose(opt.value)}
                          className="sr-only"
                        />
                        <div
                          className={`border-2 p-3 flex gap-3 items-start transition-colors ${
                            selected
                              ? 'border-gov-primary bg-gov-primary-tint'
                              : 'border-gov-border bg-white hover:border-gov-primary'
                          }`}
                        >
                          <span className="w-9 h-9 flex items-center justify-center bg-gov-primary-tint border border-gov-border shrink-0 text-gov-primary" aria-hidden="true">
                            {opt.icon}
                          </span>
                          <div>
                            <strong className="block">
                              {serviceTypeLabel[opt.value]}
                            </strong>
                            <span className="text-sm text-gray-600">
                              {opt.description}
                            </span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <label
                  htmlFor="reason"
                  className="block font-semibold mb-1 text-[0.95rem]"
                >
                  อาการ/เหตุผลเบื้องต้น{' '}
                  <span className="text-gray-500 font-normal">(ไม่บังคับ)</span>
                </label>
                <span className="block text-sm text-gray-500 mb-1">
                  ไม่ต้องระบุการวินิจฉัย/อาการละเอียด เพื่อความเป็นส่วนตัว
                </span>
                <textarea
                  id="reason"
                  rows={3}
                  maxLength={200}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="เช่น นัดติดตามผลเลือดจากครั้งก่อน"
                  className="w-full px-3 py-2 border-2 border-gray-900 rounded-none"
                />
              </section>
            </>
          )}

          {step === 2 && (
            <>
              <section className="bg-white border border-gov-border p-5 mb-5">
                <h2 className="text-lg font-semibold pb-2 mb-3 border-b border-gov-border">
                  2.1 เลือกวันที่ต้องการเข้ารับบริการ
                </h2>
                <DateGrid
                  selectedDate={selectedDate}
                  onSelect={(d) => {
                    setSelectedDate(d);
                    setSelectedSlot(null);
                  }}
                />
              </section>

              {selectedDate && (
                <section className="bg-white border border-gov-border p-5 mb-5">
                  <h2 className="text-lg font-semibold pb-2 mb-3 border-b border-gov-border">
                    2.2 เลือกช่วงเวลา ·{' '}
                    <span className="font-normal text-gray-600">
                      {formatBuddhistDate(selectedDate)}
                    </span>
                  </h2>
                  <TimeSlotGrid
                    hospitalId={hospitalId}
                    date={selectedDate}
                    selectedSlotId={selectedSlot?.id ?? null}
                    onSelect={setSelectedSlot}
                  />
                  <p className="text-sm text-gray-500 mt-4">
                    โปรดมาถึงโรงพยาบาลก่อนเวลานัด 30 นาที เพื่อทำเอกสารและตรวจสอบสิทธิ
                  </p>
                </section>
              )}
            </>
          )}

          {step === 3 && selectedDate && selectedSlot && (
            <section className="bg-white border-2 border-gov-ink p-6 mb-5">
              <h2 className="text-lg font-semibold pb-2 mb-3 border-b border-gov-border">
                ตรวจสอบรายละเอียดก่อนยืนยัน
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-x-4 gap-y-0.5 sm:gap-y-2 [&>dt]:text-xs [&>dt]:text-gray-400 [&>dt]:uppercase [&>dt]:tracking-wide [&>dt]:pt-3 [&>dt:first-child]:pt-0 [&>dt]:sm:text-base [&>dt]:sm:normal-case [&>dt]:sm:tracking-normal [&>dt]:sm:text-gray-500 [&>dt]:sm:pt-0">
                <dt className="text-gray-500">ผู้รับบริการ</dt>
                <dd className="font-medium">{user.fullName}</dd>
                <dt className="text-gray-500">โรงพยาบาล</dt>
                <dd className="font-medium">
                  {hospital ? hospital.shortName : hospitalId}
                </dd>
                <dt className="text-gray-500">วัตถุประสงค์</dt>
                <dd className="font-medium">{serviceTypeLabel[purpose]}</dd>
                {reason && (
                  <>
                    <dt className="text-gray-500">เหตุผลเบื้องต้น</dt>
                    <dd className="font-medium">{reason}</dd>
                  </>
                )}
                <dt className="text-gray-500">วันที่นัด</dt>
                <dd className="font-medium">
                  <strong>{formatBuddhistDate(selectedDate)}</strong>
                </dd>
                <dt className="text-gray-500">ช่วงเวลา</dt>
                <dd className="font-medium">
                  <strong>
                    {formatTimeRange(selectedSlot.startTime, selectedSlot.endTime)}
                  </strong>{' '}
                  <span className="text-sm text-gray-500">
                    (มาก่อนเวลานัด 30 นาที)
                  </span>
                </dd>
              </dl>

              <div className="mt-5 bg-gov-primary-tint border-l-[6px] border-gov-primary px-4 py-3 text-sm">
                <strong>หมายเหตุ:</strong> หลังยืนยัน
                ระบบจะออกหมายเลขจองและหมายเลขคิวให้ทันที
                ท่านสามารถดูสถานะคิวได้ที่หน้านัดหมายของฉัน
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="bg-white border border-gov-border p-5">
            <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-2">
              สรุปการจอง
            </h3>
            <p>
              <strong>
                {hospital ? hospital.shortName : hospitalId || '—'}
              </strong>
              <br />
              <span className="text-sm text-gray-500">
                {hospital ? hospital.address : ''}
              </span>
            </p>
            <hr className="my-3 border-gov-border" />
            <p>
              <span className="text-sm text-gray-500">
                {serviceTypeLabel[purpose]}
              </span>
            </p>
            {selectedDate && (
              <>
                <hr className="my-3 border-gov-border" />
                <p>
                  <strong>วันที่:</strong> {formatBuddhistDate(selectedDate)}
                </p>
                {selectedSlot && (
                  <p>
                    <strong>เวลา:</strong>{' '}
                    {formatTimeRange(selectedSlot.startTime, selectedSlot.endTime)}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="bg-white border border-gov-border p-5 text-sm">
            <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-2">
              ข้อมูลผู้รับบริการ
            </h3>
            <p>
              <strong>{user.fullName}</strong>
            </p>
          </div>
        </aside>
      </div>

      <div className="flex flex-wrap gap-3 items-center mt-5">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => ((s - 1) as Step))}
            className="px-5 py-2.5 font-semibold text-gov-ink bg-white border-2 border-gray-900 hover:bg-gray-100"
          >
            ← ย้อนกลับ
          </button>
        )}
        {step === 1 && (
          <Link
            to="/my-appointments"
            className="px-5 py-2.5 font-semibold text-gov-ink bg-white border-2 border-gray-900 hover:bg-gray-100"
          >
            ยกเลิก
          </Link>
        )}
        <span className="flex-1" />
        <span className="text-gray-500 text-sm">ขั้นที่ {step} จาก 3</span>
        {step < 3 ? (
          <button
            type="button"
            onClick={goNext}
            className="px-5 py-2.5 font-semibold text-white bg-gov-primary border-2 border-gov-primary-dark hover:bg-gov-primary-dark"
          >
            ถัดไป →
          </button>
        ) : (
          <button
            type="button"
            onClick={confirm}
            disabled={submitting}
            className="px-5 py-2.5 font-semibold text-white bg-gov-primary border-2 border-gov-primary-dark hover:bg-gov-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'กำลังบันทึก…' : 'ยืนยันการจอง'}
          </button>
        )}
      </div>
    </div>
  );
}

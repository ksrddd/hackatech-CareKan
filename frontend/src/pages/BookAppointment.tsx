import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
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
  clinicLabel,
  insuranceRightLabel,
  serviceTypeLabel,
  type ClinicCode,
  type ServiceType,
  type TimeSlot,
} from '@/lib/types';

type Step = 1 | 2 | 3;

const PURPOSE_OPTIONS: { value: ServiceType; icon: string; description: string }[] = [
  { value: 'opd', icon: '🩺', description: 'ฉันมีอาการบางอย่าง อยากให้แพทย์ตรวจ' },
  { value: 'new_patient', icon: '📋', description: 'ครั้งแรกที่มา รพ. นี้' },
  { value: 'follow_up', icon: '🔄', description: 'ตามที่หมอเคยนัดไว้' },
  { value: 'checkup', icon: '💉', description: 'ตรวจร่างกาย / ตรวจเลือดประจำปี' },
  { value: 'medication', icon: '💊', description: 'รับยาเรื้อรังที่หมอสั่งไว้' },
  { value: 'lab', icon: '🧪', description: 'ตรวจเลือดหรือผลแลป' },
];

export function BookAppointment() {
  const { user } = useAuth();
  const [search] = useSearchParams();
  const create = useCreateAppointment();
  const navigate = useNavigate();

  const { state: hospitalsState } = useHospitals({});

  // Determine the initial hospitalId from URL param; fall back once hospitals load
  const urlHospital = search.get('hospital');

  const [step, setStep] = useState<Step>(1);
  const [hospitalId, setHospitalId] = useState<string>(urlHospital ?? '');
  const [clinic, setClinic] = useState<ClinicCode>('med');
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
  const availableClinics: ClinicCode[] =
    hospitalDetailState.kind === 'success' ? hospitalDetailState.data.clinics : ['med'];

  useEffect(() => {
    if (!availableClinics.includes(clinic)) {
      setClinic(availableClinics[0] ?? 'med');
    }
  }, [availableClinics, clinic]);

  useEffect(() => {
    setSelectedDate(null);
    setSelectedSlot(null);
  }, [hospitalId, clinic]);

  function goNext() {
    setError(null);
    if (step === 1) {
      if (!hospitalId || !clinic) {
        setError('โปรดเลือกโรงพยาบาลและคลินิก');
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
      clinic,
      purpose,
      reason,
      slotId: selectedSlot.id,
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

      <BookingStepper
        steps={[
          { label: 'เลือกโรงพยาบาลและคลินิก' },
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
              <section className="bg-white border border-gov-border p-5 mb-5">
                <h2 className="text-lg font-semibold pb-2 mb-3 border-b border-gov-border">
                  1.1 เลือกโรงพยาบาล
                </h2>
                {hospitalsState.kind === 'submitting' && (
                  <p className="text-sm text-gray-500">กำลังโหลด…</p>
                )}
                {hospitalsState.kind === 'error' && (
                  <p className="text-sm text-gov-err-ink">
                    โหลดรายชื่อโรงพยาบาลไม่สำเร็จ: {hospitalsState.error.message}
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
                                {h.address} · ห่าง {h.mockDistanceKm.toFixed(1)} กม.
                              </span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section className="bg-white border border-gov-border p-5 mb-5">
                <h2 className="text-lg font-semibold pb-2 mb-3 border-b border-gov-border">
                  1.2 เลือกคลินิก / แผนก
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      htmlFor="clinic"
                      className="block font-semibold mb-1 text-[0.95rem]"
                    >
                      คลินิกที่ต้องการเข้ารับบริการ
                    </label>
                    <select
                      id="clinic"
                      value={clinic}
                      onChange={(e) =>
                        setClinic(e.target.value as ClinicCode)
                      }
                      className="w-full px-3 py-2 border-2 border-gray-900 rounded-none"
                    >
                      {availableClinics.map((c) => (
                        <option key={c} value={c}>
                          {clinicLabel[c]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              <section className="bg-white border border-gov-border p-5 mb-5">
                <h2 className="text-lg font-semibold pb-2 mb-3 border-b border-gov-border">
                  1.3 วัตถุประสงค์
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
                          <span className="text-3xl" aria-hidden="true">
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
                  hospitalId={hospitalId}
                  clinic={clinic}
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
                    clinic={clinic}
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
              <dl className="grid grid-cols-[180px_1fr] gap-x-4 gap-y-2">
                <dt className="text-gray-500">ผู้รับบริการ</dt>
                <dd className="font-medium">{user.fullName}</dd>
                <dt className="text-gray-500">สิทธิการรักษา</dt>
                <dd className="font-medium">
                  {insuranceRightLabel[user.insuranceRight]}
                </dd>
                <dt className="text-gray-500">โรงพยาบาล</dt>
                <dd className="font-medium">
                  {hospital ? hospital.shortName : hospitalId}
                </dd>
                <dt className="text-gray-500">คลินิก</dt>
                <dd className="font-medium">{clinicLabel[clinic]}</dd>
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
              <strong>{clinicLabel[clinic]}</strong>
              <br />
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
            <p className="text-sm text-gray-500">
              {insuranceRightLabel[user.insuranceRight]}
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

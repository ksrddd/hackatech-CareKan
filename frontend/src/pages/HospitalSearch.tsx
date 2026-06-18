import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HospitalCard } from '@/components/HospitalCard';
import { useHospitals } from '@/lib/hospitals';
import {
  insuranceRightLabel,
  serviceTypeLabel,
  zoneLabel,
  type InsuranceRight,
  type ServiceType,
  type Zone,
} from '@/lib/types';

const ALL_DISTRICTS = [
  // กรุงเทพกลาง
  'พระนคร', 'ดุสิต', 'ป้อมปราบศัตรูพ่าย', 'สัมพันธวงศ์', 'ดินแดง',
  'ห้วยขวาง', 'พญาไท', 'ราชเทวี', 'วังทองหลาง',
  // กรุงเทพเหนือ
  'จตุจักร', 'บางซื่อ', 'ลาดพร้าว', 'หลักสี่', 'ดอนเมือง', 'สายไหม', 'บางเขน',
  // กรุงเทพใต้
  'สาทร', 'บางรัก', 'บางคอแหลม', 'ยานนาวา', 'คลองเตย', 'วัฒนา',
  'ปทุมวัน', 'พระโขนง', 'สวนหลวง', 'บางนา',
  // กรุงเทพตะวันออก
  'ลาดกระบัง', 'มีนบุรี', 'หนองจอก', 'คลองสามวา', 'สะพานสูง', 'ประเวศ',
  'บางกะปิ', 'บึงกุ่ม', 'คันนายาว',
  // กรุงธนเหนือ
  'ธนบุรี', 'คลองสาน', 'จอมทอง', 'บางกอกใหญ่', 'บางกอกน้อย',
  'บางพลัด', 'ตลิ่งชัน', 'ทวีวัฒนา',
  // กรุงธนใต้
  'ภาษีเจริญ', 'หนองแขม', 'บางแค', 'บางขุนเทียน', 'บางบอน', 'ทุ่งครุ', 'ราษฎร์บูรณะ',
];

export function HospitalSearch() {
  const [query, setQuery] = useState('');
  const [districts, setDistricts] = useState<Set<string>>(new Set());
  const [zones, setZones] = useState<Set<Zone>>(new Set());
  const [services, setServices] = useState<Set<ServiceType>>(new Set());
  const [rights, setRights] = useState<Set<InsuranceRight>>(new Set());
  const [sortBy, setSortBy] = useState<'distance' | 'name'>('distance');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const { state } = useHospitals({});

  const sortedHospitals = useMemo(() => {
    if (state.kind !== 'success') return [];
    let list = [...state.data];
    const q = query.trim().toLowerCase();
    if (q)
      list = list.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.shortName.toLowerCase().includes(q) ||
          h.district.toLowerCase().includes(q),
      );
    if (zones.size > 0) list = list.filter((h) => zones.has(h.zone as Zone));
    if (services.size > 0)
      list = list.filter((h) => [...services].some((s) => h.services.includes(s)));
    if (rights.size > 0)
      list = list.filter((h) => [...rights].some((r) => h.rightsAccepted.includes(r)));
    if (districts.size > 0) list = list.filter((h) => districts.has(h.district));
    if (sortBy === 'distance') list.sort((a, b) => a.mockDistanceKm - b.mockDistanceKm);
    else list.sort((a, b) => a.shortName.localeCompare(b.shortName, 'th'));
    return list;
  }, [state, query, zones, services, rights, districts, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedHospitals.length / PAGE_SIZE));
  useEffect(() => {
    setPage(0);
  }, [query, districts, zones, services, rights, sortBy]);
  useEffect(() => {
    if (page >= totalPages) setPage(0);
  }, [page, totalPages]);

  const pagedHospitals = useMemo(
    () => sortedHospitals.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [sortedHospitals, page],
  );

  function toggle<T>(set: Set<T>, val: T, setter: (s: Set<T>) => void) {
    const next = new Set(set);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    setter(next);
  }

  function clearAll() {
    setDistricts(new Set());
    setZones(new Set());
    setServices(new Set());
    setRights(new Set());
    setQuery('');
  }

  const totalCount = state.kind === 'success' ? state.data.length : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-12">
      <p className="text-sm text-gray-500 mb-2">
        <Link to="/" className="text-blue-800 hover:underline">
          หน้าหลัก
        </Link>{' '}
        › ค้นหาโรงพยาบาล
      </p>
      <h1 className="text-2xl font-bold mb-1">ค้นหาโรงพยาบาล</h1>
      <p className="text-gray-600 mb-5">
        โรงพยาบาลรัฐในกรุงเทพมหานคร
        {totalCount !== null && (
          <>
            {' '}ทั้งหมด <strong>{totalCount} โรงพยาบาล</strong>
          </>
        )}
      </p>

      <form
        className="flex flex-wrap gap-2 mb-5"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="flex-1 min-w-[220px]">
          <label htmlFor="q" className="sr-only">
            ค้นหา
          </label>
          <input
            id="q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นชื่อโรงพยาบาล หรือเขต เช่น 'กลาง' 'ตากสิน' 'บางพลัด'"
            className="w-full px-3 py-2 border-2 border-gray-900 rounded-none focus:border-gov-primary"
          />
        </div>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
        <aside className="bg-white border border-gov-border p-4 self-start">
          <h2 className="font-bold text-base pb-2 mb-3 border-b border-gov-border">
            ตัวกรอง
          </h2>

          <fieldset className="mb-4">
            <legend className="font-semibold text-sm mb-2">เขต</legend>
            <div className="max-h-56 overflow-y-auto pr-1 border border-gov-border bg-gray-50 p-2">
              {ALL_DISTRICTS.map((d) => (
                <label key={d} className="block text-sm mb-1">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={districts.has(d)}
                    onChange={() => toggle(districts, d, setDistricts)}
                  />
                  {d}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mb-4">
            <legend className="font-semibold text-sm mb-2">โซน</legend>
            {(Object.keys(zoneLabel) as Zone[]).map((z) => (
              <label key={z} className="block text-sm mb-1">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={zones.has(z)}
                  onChange={() => toggle(zones, z, setZones)}
                />
                {zoneLabel[z]}
              </label>
            ))}
          </fieldset>

          <fieldset className="mb-4">
            <legend className="font-semibold text-sm mb-2">ประเภทบริการ</legend>
            {(Object.keys(serviceTypeLabel) as ServiceType[]).map((s) => (
              <label key={s} className="block text-sm mb-1">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={services.has(s)}
                  onChange={() => toggle(services, s, setServices)}
                />
                {serviceTypeLabel[s]}
              </label>
            ))}
          </fieldset>

          <fieldset className="mb-4">
            <legend className="font-semibold text-sm mb-2">สิทธิที่ใช้ได้</legend>
            {(Object.keys(insuranceRightLabel) as InsuranceRight[]).map((r) => (
              <label key={r} className="block text-sm mb-1">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={rights.has(r)}
                  onChange={() => toggle(rights, r, setRights)}
                />
                {insuranceRightLabel[r]}
              </label>
            ))}
          </fieldset>

          <div className="flex justify-between mt-4 text-sm">
            <button
              type="button"
              onClick={clearAll}
              className="text-blue-800 hover:underline"
            >
              ล้างตัวกรอง
            </button>
          </div>
        </aside>

        <section>
          <div className="flex justify-between items-center mb-3 text-sm">
            <span>
              {state.kind === 'submitting' && 'กำลังโหลด…'}
              {state.kind === 'success' && sortedHospitals.length > 0 && (
                <>
                  แสดง{' '}
                  <strong>
                    {page * PAGE_SIZE + 1}–
                    {Math.min((page + 1) * PAGE_SIZE, sortedHospitals.length)}
                  </strong>{' '}
                  จาก <strong>{sortedHospitals.length}</strong> รายการ
                </>
              )}
              {state.kind === 'success' && sortedHospitals.length === 0 && (
                <>ไม่พบรายการ</>
              )}
              {state.kind === 'error' && 'เกิดข้อผิดพลาด'}
              {state.kind === 'idle' && ''}
            </span>
            <label className="flex items-center gap-2">
              เรียงตาม:
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as 'distance' | 'name')
                }
                className="border border-gov-border px-2 py-1"
              >
                <option value="distance">ระยะทาง</option>
                <option value="name">ตัวอักษร</option>
              </select>
            </label>
          </div>

          {(state.kind === 'idle' || state.kind === 'submitting') && (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-white border border-gov-border p-4 h-28 animate-pulse"
                />
              ))}
            </div>
          )}

          {state.kind === 'error' && (
            <div className="bg-white border border-gov-err-ink p-8 text-center text-gov-err-ink">
              ไม่สามารถโหลดข้อมูลได้: {state.error.message}
            </div>
          )}

          {state.kind === 'success' && sortedHospitals.length === 0 && (
            <div className="bg-white border border-gov-border p-8 text-center text-gray-500">
              ไม่พบโรงพยาบาลที่ตรงกับตัวกรอง ลองล้างตัวกรองหรือเปลี่ยนคำค้นหา
            </div>
          )}

          {state.kind === 'success' && sortedHospitals.length > 0 && (
            <>
              <div className="space-y-4">
                {pagedHospitals.map((h) => (
                  <HospitalCard key={h.id} hospital={h} />
                ))}
              </div>
              {totalPages > 1 && (
                <nav
                  className="flex items-center justify-center gap-1 mt-6"
                  aria-label="แบ่งหน้า"
                >
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1 border border-gov-border bg-white disabled:opacity-40 hover:bg-gray-50"
                    aria-label="หน้าก่อนหน้า"
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i).map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPage(i)}
                      aria-current={i === page ? 'page' : undefined}
                      className={
                        i === page
                          ? 'px-3 py-1 border-2 border-gov-primary bg-gov-primary text-white font-semibold'
                          : 'px-3 py-1 border border-gov-border bg-white hover:bg-gray-50'
                      }
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-3 py-1 border border-gov-border bg-white disabled:opacity-40 hover:bg-gray-50"
                    aria-label="หน้าถัดไป"
                  >
                    ›
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

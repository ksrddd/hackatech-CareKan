import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HospitalCard } from '@/components/HospitalCard';
import { HOSPITALS } from '@/lib/mockData';
import {
  insuranceRightLabel,
  serviceTypeLabel,
  zoneLabel,
  type InsuranceRight,
  type ServiceType,
  type Zone,
} from '@/lib/types';

const ALL_DISTRICTS = Array.from(
  new Set(HOSPITALS.map((h) => h.district)),
);

export function HospitalSearch() {
  const [query, setQuery] = useState('');
  const [districts, setDistricts] = useState<Set<string>>(new Set());
  const [zones, setZones] = useState<Set<Zone>>(new Set());
  const [services, setServices] = useState<Set<ServiceType>>(new Set());
  const [rights, setRights] = useState<Set<InsuranceRight>>(new Set());
  const [sortBy, setSortBy] = useState<'distance' | 'name'>('distance');

  const filtered = useMemo(() => {
    const q = query.trim();
    let res = HOSPITALS.filter((h) => {
      if (districts.size && !districts.has(h.district)) return false;
      if (zones.size && !zones.has(h.zone)) return false;
      if (services.size && !h.services.some((s) => services.has(s))) return false;
      if (rights.size && !h.rightsAccepted.some((r) => rights.has(r))) return false;
      if (q) {
        const hay = `${h.name}${h.shortName}${h.district}`;
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    if (sortBy === 'distance')
      res = res.slice().sort((a, b) => a.mockDistanceKm - b.mockDistanceKm);
    else res = res.slice().sort((a, b) => a.shortName.localeCompare(b.shortName));
    return res;
  }, [query, districts, zones, services, rights, sortBy]);

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
        ในเครือ สำนักการแพทย์ กรุงเทพมหานคร ทั้งหมด{' '}
        <strong>{HOSPITALS.length} โรงพยาบาล</strong>
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
              แสดง <strong>{filtered.length}</strong> จาก {HOSPITALS.length} รายการ
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

          {filtered.length === 0 ? (
            <div className="bg-white border border-gov-border p-8 text-center text-gray-500">
              ไม่พบโรงพยาบาลที่ตรงกับตัวกรอง ลองล้างตัวกรองหรือเปลี่ยนคำค้นหา
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((h) => (
                <HospitalCard key={h.id} hospital={h} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

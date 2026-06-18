import { useState, useEffect, useRef } from 'react';

const LINE_OA_URL = 'https://line.me/R/ti/p/@174efayk';

const CONTACTS = [
  {
    key: 'line',
    label: 'LINE OA',
    sub: '@174efayk',
    href: LINE_OA_URL,
    bg: 'bg-[#06C755] hover:bg-[#05a847]',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.07 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
      </svg>
    ),
  },
  {
    key: 'tel',
    label: 'โทร 1555',
    sub: 'สายด่วน 24 ชม.',
    href: 'tel:1555',
    bg: 'bg-gov-primary hover:bg-gov-primary-dark',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
];

export function FloatingContactButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // ปิดเมื่อคลิกข้างนอก
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <div
      ref={ref}
      className="fixed bottom-5 right-4 md:bottom-6 md:right-5 z-50 flex flex-col items-end gap-2.5"
    >
      {/* Contact options — slide up เมื่อ open */}
      <div
        className={`flex flex-col items-end gap-2 transition-all duration-200 origin-bottom ${
          open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
        }`}
        aria-hidden={!open}
      >
        {CONTACTS.map(({ key, label, sub, href, bg, icon }, i) => (
          <a
            key={key}
            href={href}
            target={key === 'line' ? '_blank' : undefined}
            rel={key === 'line' ? 'noopener noreferrer' : undefined}
            className={`flex items-center gap-3 pl-3 pr-4 py-2.5 text-white rounded-full shadow-lg transition-all duration-200 ${bg}`}
            style={{ transitionDelay: open ? `${i * 40}ms` : '0ms' }}
            onClick={() => setOpen(false)}
          >
            <span className="shrink-0">{icon}</span>
            <span className="text-right leading-tight">
              <span className="block text-sm font-semibold">{label}</span>
              <span className="block text-xs opacity-85">{sub}</span>
            </span>
          </a>
        ))}
      </div>

      {/* Main toggle button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'ปิดช่องทางติดต่อ' : 'ช่องทางติดต่อ'}
        className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-all duration-300 ${
          open
            ? 'bg-gray-600 hover:bg-gray-700 rotate-45'
            : 'bg-gov-primary hover:bg-gov-primary-dark animate-wobble'
        }`}
      >
        {open ? (
          /* X icon */
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          /* Chat icon */
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </div>
  );
}

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function PageLoader() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !ref.current) return;

    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from('.ck-pl-badge', { scale: 0.5, opacity: 0, duration: 0.5, ease: 'back.out(2)' })
        .from('.ck-pl-name', { x: -14, opacity: 0, duration: 0.4 }, '-=0.25')
        .from('.ck-pl-sub', { opacity: 0, y: 8, duration: 0.35 }, '-=0.15')
        .from('.ck-pl-dot', { scaleY: 0, opacity: 0, stagger: 0.1, duration: 0.3, ease: 'power2.out', transformOrigin: 'bottom center' }, '-=0.05');
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={ref}
      role="status"
      aria-label="กำลังโหลด"
      className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center"
    >
      {/* Logo row */}
      <div className="flex items-center gap-3 mb-2">
        <div className="ck-pl-badge w-[52px] h-[52px] shrink-0">
          <img
            src="/carekan-logo.jpg"
            alt="CareKan"
            className="w-full h-full object-contain"
          />
        </div>
        <span className="ck-pl-name text-[1.75rem] font-bold text-gov-ink tracking-tight leading-none">
          CareKan
        </span>
      </div>

      {/* Tagline */}
      <p className="ck-pl-sub text-sm text-gray-500 mb-12 tracking-wide">
        จองคิวโรงพยาบาลรัฐ · กรุงเทพมหานคร
      </p>

      {/* Bouncing dots */}
      <div className="flex gap-2.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="ck-pl-dot block w-2.5 h-2.5 rounded-full bg-gov-primary animate-bounce"
            style={{ animationDelay: `${i * 160}ms`, animationDuration: '0.85s' }}
          />
        ))}
      </div>
    </div>
  );
}

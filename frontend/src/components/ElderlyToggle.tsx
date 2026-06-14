import { useElderlyMode } from '@/lib/elderlyMode';

export function ElderlyToggle() {
  const { isOn, toggle } = useElderlyMode();
  return (
    <button
      type="button"
      onClick={toggle}
      className="elderly-toggle"
      aria-label="สลับโหมดผู้สูงวัย"
      aria-pressed={isOn}
    >
      <span aria-hidden="true">Aa</span>
      <span data-state data-state-off>
        โหมดผู้สูงวัย
      </span>
      <span data-state data-state-on>
        เปิดโหมดผู้สูงวัยอยู่ ✓
      </span>
    </button>
  );
}

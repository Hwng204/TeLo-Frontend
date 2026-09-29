import type { StatusTone } from '../../utils/directory';

/** Nhãn trạng thái nền nhạt (Status Field Rule trong DESIGN.md). */
export const StatusPill = ({ label, tone }: { label: string; tone: StatusTone }) => (
  <span className={`sep-status sep-status--${tone}`}>{label}</span>
);

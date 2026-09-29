import type { ReactNode } from 'react';

export type InfoItem = {
  label: string;
  value: ReactNode;
  /** `wide` chiếm 2 cột, `full` chiếm cả hàng; mặc định 1 trong 4 cột. */
  span?: 'wide' | 'full';
  /** Nội dung dài nhiều dòng (yêu cầu công việc...): giữ xuống dòng, chữ thường. */
  text?: boolean;
};

const SPAN_CLASS = { wide: ' sep-span-2', full: ' sep-span-full' };

/** Lưới thông tin chỉ đọc: nhãn ở trên, giá trị trong ô nền nhạt (cùng kiểu ô bị khoá). */
export const InfoGrid = ({ items }: { items: InfoItem[] }) => (
  <dl className="sep-fields">
    {items.map((item) => (
      <div key={item.label} className={`sep-readfield${item.span ? SPAN_CLASS[item.span] : ''}`}>
        <dt className="pcb-label">{item.label}</dt>
        <dd className={`sep-readfield__value${item.text ? ' sep-readfield__value--text' : ''}`}>{item.value}</dd>
      </div>
    ))}
  </dl>
);

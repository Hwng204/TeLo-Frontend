import type { ReactNode } from 'react';

type Row = [string, ReactNode];
type Group = { title?: string; rows: Row[] };

/** `rows` cho khối đơn giản; `groups` khi cần tách các cụm ý nghĩa khác nhau (ví dụ: định danh / người thực hiện / phạm vi). */
type Props = { rows: Row[]; groups?: never } | { rows?: never; groups: Group[] };

export const MatrixSummary = (props: Props) => {
  const groups: Group[] = props.groups ?? [{ rows: props.rows }];
  return (
    <div className="pcb-card sep-summary-card">
      {groups.map((group, i) => (
        <dl key={group.title ?? i} className="sep-summary">
          {group.title && <div className="sep-summary__title">{group.title}</div>}
          {group.rows.map(([label, value]) => (
            <div key={label} style={{ display: 'contents' }}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ))}
    </div>
  );
};

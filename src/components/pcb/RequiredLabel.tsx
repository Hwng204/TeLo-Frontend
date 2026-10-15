import type { ReactNode } from 'react';

/** Nhãn bắt buộc dùng chung; hỗ trợ nhãn cũ có dấu * ở cuối. */
export const RequiredLabel = ({ children, required = false }: { children: ReactNode; required?: boolean }) => {
  const marked = typeof children === 'string' && /\*\s*$/.test(children);
  const label = marked ? children.replace(/\s*\*\s*$/, '') : children;
  return <>{label}{(required || marked) && <span className="pcb-required" aria-hidden="true"> *</span>}</>;
};

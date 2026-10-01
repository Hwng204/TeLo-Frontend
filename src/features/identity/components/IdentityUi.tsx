import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Field, PcbButton } from '../../../components/pcb';
import { TableState } from '../../../components/common/TableState';
import { Pager } from '../../../components/common/Pager';
import { identityError, identityPageWithinRange } from '../../../utils/identity';
import type { DirectoryPage } from '../../../types';

export function IdentityDialog({ title, children, onClose, busy = false }: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return <dialog
    ref={ref}
    className="sep-dialog identity-dialog"
    aria-labelledby={id}
    onCancel={event => {
      event.preventDefault();
      if (!busy) onClose();
    }}
  >
    <div className="identity-dialog__head">
      <h2 id={id}>
        {title}
      </h2>
      <PcbButton
        variant="ghost"
        disabled={busy}
        onClick={onClose}
        aria-label="Đóng hộp thoại"
      >Đóng</PcbButton>
    </div>
    {children}
  </dialog>;
}
export function IdentitySearch({ value, onChange, label = 'Tìm theo mã hoặc tên' }: {
  value: string;
  onChange: (value: string) => void;
  label?: string
}) {
  return <Field
    type="search"
    label={label}
    value={value}
    maxLength={150}
    onChange={event => onChange(event.target.value)}
    leading="search"
  />;
}
export function IdentityState({ loading, error, count, reload }: {
  loading: boolean;
  error: unknown;
  count: number;
  reload: () => void
}) {
  return <>
    {!!error && <div className="sep-alert" role="alert">
      {identityError(error)}
      <PcbButton variant="secondary" onClick={reload}>Thử lại</PcbButton>
    </div>}
    <TableState
      loading={loading}
      failed={!!error}
      empty={!count}
      columns={3}
      title="Không có kết quả phù hợp"
      hint="Thử thay đổi từ khóa hoặc bộ lọc."
    />
  </>;
}
export function IdentityPager({ data, page, pageSize, setPage, setPageSize, label }: {
  data?: DirectoryPage<unknown>;
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  label: string;
}) {
  const totalCount = data?.totalCount;
  useEffect(() => {
    if (totalCount === undefined) return;
    const nextPage = identityPageWithinRange(page, pageSize, totalCount);
    if (nextPage !== page) setPage(nextPage);
  }, [totalCount, page, pageSize, setPage]);
  return data && <Pager
    page={page}
    pageSize={pageSize}
    totalCount={data.totalCount}
    itemLabel={label}
    onChange={setPage}
    onPageSizeChange={size => {
      setPageSize(size);
      setPage(1);
    }}
  />;
}
export function IdentityStatusBadge({ status, account = false }: {
  status: string;
  account?: boolean
}) {
  const label = status === 'LOCKED' ? 'Đã khóa' : status === 'ACTIVE' ? (account ? 'Đang hoạt động' : 'Đang áp dụng') : (account ? 'Ngừng hoạt động' : 'Ngừng áp dụng');
  return <span className={`sep-status sep-status--${status === 'ACTIVE' ? 'green' : 'gray'}`}>
    {label}
  </span>;
}

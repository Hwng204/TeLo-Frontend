import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Field, Icon, PcbButton, PcbIconButton } from '../../../components/pcb';
import { TableState } from '../../../components/common/TableState';
import { Pager } from '../../../components/common/Pager';
import { identityError, identityPageWithinRange } from '../../../utils/identity';
import type { DirectoryPage } from '../../../types';

export function IdentityDialog({ title, children, onClose, busy = false, className = '', icon = 'manage_accounts' }: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
  className?: string;
  icon?: string;
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
    className={`sep-dialog identity-dialog${className ? ` ${className}` : ''}`}
    aria-labelledby={id}
    aria-busy={busy}
    onCancel={event => {
      event.preventDefault();
      if (!busy) onClose();
    }}
  >
    <div className="identity-dialog__head">
      <div className="identity-dialog__title">
        <span className="identity-dialog__icon"><Icon name={icon} size={24} /></span>
        <div>
          <h2 id={id}>{title}</h2>
        </div>
      </div>
      <PcbIconButton
        icon="close"
        label="Đóng hộp thoại"
        disabled={busy}
        onClick={onClose}
      />
    </div>
    {children}
  </dialog>;
}
export function IdentitySearch({ value, onChange, label = 'Tìm theo mã hoặc tên', hideLabel = false, placeholder }: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  hideLabel?: boolean;
  placeholder?: string;
}) {
  return <Field
    type="search"
    label={label}
    hideLabel={hideLabel}
    placeholder={placeholder}
    value={value}
    maxLength={150}
    onChange={event => onChange(event.target.value)}
    leading="search"
  />;
}
export function IdentityState({ loading, error, count, reload, columns = 3, emptyTitle = 'Không có kết quả phù hợp', emptyHint = 'Thử thay đổi từ khóa hoặc bộ lọc.', emptyAction }: {
  loading: boolean;
  error: unknown;
  count: number;
  reload: () => void;
  columns?: number;
  emptyTitle?: string;
  emptyHint?: string;
  emptyAction?: ReactNode;
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
      columns={columns}
      title={emptyTitle}
      hint={emptyHint}
      action={emptyAction}
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

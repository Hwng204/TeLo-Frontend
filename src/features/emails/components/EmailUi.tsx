import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useAsync, useDebounce } from '../../../hooks';
import { api } from '../../../services/api';
import { Field, PcbButton, SelectField } from '../../../components/pcb';
import { TableState } from '../../../components/common/TableState';
import { Pager } from '../../../components/common/Pager';
import { toProblem, problemLines } from '../../../utils/problem';
import type { DirectoryPage, EmailEventItem } from '../../../types';

export function EmailDialog({ title, children, onClose, busy = false }: {
  title: string; children: ReactNode; onClose: () => void; busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return (
    <dialog ref={ref} className="sep-dialog email-dialog" aria-labelledby={id}
      onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
      <div className="email-dialog__head"><h2 id={id}>{title}</h2><PcbButton variant="ghost" disabled={busy} onClick={onClose}>Đóng</PcbButton></div>
      {children}
    </dialog>
  );
}

export function EmailState({ loading, error, count, reload }: { loading: boolean; error: unknown; count: number; reload: () => void }) {
  return <>
    {!!error && <div className="sep-alert" role="alert">{problemLines(toProblem(error)).join(' ')}<PcbButton variant="secondary" onClick={reload}>Thử lại</PcbButton></div>}
    <TableState loading={loading} failed={!!error} empty={!count} columns={4} title="Không có dữ liệu phù hợp" />
  </>;
}

export function EmailPager({ data, page, pageSize, setPage, setPageSize, label = 'bản ghi' }: {
  data?: DirectoryPage<unknown>; page: number; pageSize: number; setPage: (value: number) => void; setPageSize: (value: number) => void; label?: string;
}) {
  const count = data?.totalCount;
  useEffect(() => {
    if (count === undefined) return;
    const last = Math.max(1, Math.ceil(count / pageSize));
    if (page > last) setPage(last);
  }, [count, pageSize, page, setPage]);
  return data && <Pager page={page} pageSize={pageSize} totalCount={data.totalCount} itemLabel={label}
    onChange={setPage} onPageSizeChange={value => { setPageSize(value); setPage(1); }} />;
}

export function EmailSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <Field label="Tìm kiếm" type="search" leading="search" value={value} maxLength={150} onChange={event => onChange(event.target.value)} />;
}

export function EmailEventSelect({ events, value, onChange, all = true, disabled = false, schoolId, manualOnly = false }: {
  events: EmailEventItem[]; value: string; onChange: (value: string) => void; all?: boolean; disabled?: boolean; schoolId?: number; manualOnly?: boolean;
}) {
  const [picker, setPicker] = useState(false);
  const selected = useAsync(() => value && schoolId ? api.email.event(schoolId, value) : Promise.resolve(events.find(e => e.code === value)), [schoolId, value]);
  if (schoolId) return <div className="pcb-field">
    <span className="pcb-label">Sự kiện</span>
    <PcbButton variant="secondary" disabled={disabled} onClick={() => setPicker(true)}>{value ? selected.data?.name ?? value : all ? 'Tất cả sự kiện' : 'Chọn sự kiện'}</PcbButton>
    {picker && <EventPicker schoolId={schoolId} manualOnly={manualOnly} all={all} onClose={() => setPicker(false)} onChoose={code => { onChange(code); setPicker(false); }} />}
  </div>;
  return <SelectField label="Sự kiện" value={value} disabled={disabled} onChange={event => onChange(event.target.value)}>
    <option value="">{all ? 'Tất cả sự kiện' : 'Chọn sự kiện'}</option>
    {events.map(event => <option key={event.code} value={event.code}>{event.name}</option>)}
  </SelectField>;
}

function EventPicker({ schoolId, manualOnly, all, onClose, onChoose }: { schoolId: number; manualOnly: boolean; all: boolean; onClose: () => void; onChoose: (code: string) => void }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const keyword = useDebounce(search, 300);
  const list = useAsync(() => api.email.events(schoolId, { search: keyword, page, pageSize }), [schoolId, keyword, page, pageSize]);
  return <EmailDialog title="Chọn sự kiện" onClose={onClose}>
    <EmailSearch value={search} onChange={v => { setSearch(v); setPage(1); }} />
    {all && <PcbButton variant="secondary" onClick={() => onChoose('')}>Tất cả sự kiện</PcbButton>}
    <EmailState {...list} count={list.data?.items.length ?? 0} />
    <ul className="email-options">{list.data?.items.map(item => <li key={item.code}><span><strong>{item.name}</strong><small>{item.code} · {item.triggerKind === 'SYSTEM' ? 'Tự động từ nghiệp vụ' : 'Gửi thủ công / đặt lịch'} · {item.status === 'ACTIVE' ? 'Đang áp dụng' : 'Ngừng áp dụng'}</small></span>
      <PcbButton variant="secondary" disabled={manualOnly && (item.triggerKind !== 'MANUAL' || item.status !== 'ACTIVE')} onClick={() => onChoose(item.code)}>Chọn</PcbButton></li>)}</ul>
    <EmailPager data={list.data} page={page} pageSize={pageSize} setPage={setPage} setPageSize={setPageSize} label="sự kiện" />
  </EmailDialog>;
}

export function EmailStatus({ status }: { status: string }) {
  const labels: Record<string, string> = { ACTIVE: 'Đang áp dụng', INACTIVE: 'Ngừng áp dụng', PENDING: 'Chờ gửi', SENDING: 'Đang gửi', SENT: 'Đã gửi', ERROR: 'Lỗi gửi', CANCELLED: 'Đã hủy' };
  const color = ['ACTIVE', 'SENT'].includes(status) ? 'green' : ['PENDING', 'SENDING'].includes(status) ? 'blue' : status === 'ERROR' ? 'amber' : 'gray';
  return <span className={`sep-status sep-status--${color}`}>{labels[status] || status}</span>;
}

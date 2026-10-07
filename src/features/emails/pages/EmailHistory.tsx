import { useState } from 'react';
import { PcbButton, SelectField } from '../../../components/pcb';
import { useAsync, useBusy, useDebounce, useNotice } from '../../../hooks';
import { api } from '../../../services/api';
import type { EmailEventItem } from '../../../types';
import { emailDateTime, safeEmailActionUrl } from '../../../utils/email';
import { problemLines, toProblem } from '../../../utils/problem';
import { EmailDialog, EmailEventSelect, EmailPager, EmailSearch, EmailState, EmailStatus } from '../components/EmailUi';

const statuses = { PENDING: 'Chờ gửi', SENDING: 'Đang gửi', SENT: 'Đã gửi', ERROR: 'Lỗi gửi', CANCELLED: 'Đã hủy' };
const errors: Record<string, string> = {
  SMTP_ERROR: 'Máy chủ email từ chối hoặc chưa phản hồi.', EMAIL_NOT_CONFIGURED: 'Chưa cấu hình dịch vụ gửi email.',
  DELIVERY_ERROR: 'Gửi email thất bại.', DELIVERY_INTERRUPTED: 'Tiến trình gửi bị gián đoạn.',
  RECIPIENT_NO_LONGER_ELIGIBLE: 'Người nhận không còn đủ điều kiện.', INVALID_EMAIL: 'Địa chỉ email không hợp lệ.',
  CANCELLED_BY_MANAGER: 'Người quản lý đã hủy lần gửi này.',
  DUPLICATE_EMAIL: 'Địa chỉ trùng với người nhận khác; chỉ gửi một email.',
};

function HistoryDetail({ schoolId, id, onClose }: { schoolId: number; id: number; onClose: () => void }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const detail = useAsync(() => api.email.historyDetail(schoolId, id), [schoolId, id]);
  const deliveries = useAsync(() => api.email.deliveries(schoolId, id, { page, pageSize }), [schoolId, id, page, pageSize]);
  const url = safeEmailActionUrl(detail.data?.actionUrl ?? null);
  return <EmailDialog title="Chi tiết email" onClose={onClose}>
    <EmailState {...detail} count={detail.data ? 1 : 0} />
    {detail.data && <><h3>{detail.data.notification.title}</h3><pre className="email-content">{detail.data.content}</pre>
      {url && <a href={url} target="_blank" rel="noopener noreferrer">Mở nội dung liên quan</a>}</>}
    <div className="email-actions"><h3>Người nhận</h3><PcbButton variant="secondary" onClick={deliveries.reload}>Cập nhật trạng thái</PcbButton></div>
    <EmailState {...deliveries} count={deliveries.data?.items.length ?? 0} />
    {!!deliveries.data?.items.length && <div className="pcb-table-wrap"><table className="pcb-table"><thead><tr><th>Người nhận</th><th>Trạng thái</th><th>Số lần thử</th><th>Thời gian gửi</th></tr></thead>
      <tbody>{deliveries.data.items.map(item => <tr key={item.id}><td>{item.name}<div className="sep-subline">{item.email || 'Chưa có email'}</div></td>
        <td><EmailStatus status={item.status} />{item.error && <div className="sep-subline">{errors[item.error] || 'Không thể gửi đến người nhận này.'}</div>}</td>
        <td>{item.attempts}</td><td>{emailDateTime(item.sentAt)}</td></tr>)}</tbody></table></div>}
    <EmailPager data={deliveries.data} page={page} pageSize={pageSize} setPage={setPage} setPageSize={setPageSize} label="người nhận" />
  </EmailDialog>;
}

export function EmailHistory({ schoolId, events }: { schoolId: number; events: EmailEventItem[] }) {
  const [search, setSearch] = useState('');
  const [eventCode, setEventCode] = useState('');
  const [status, setStatus] = useState('');
  const [sendKind, setSendKind] = useState('');
  const [busy, run] = useBusy();
  const notice = useNotice();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState<number | null>(null);
  const keyword = useDebounce(search, 300);
  const list = useAsync(() => api.email.history(schoolId, { search: keyword, eventCode, status, sendKind, page, pageSize }), [schoolId, keyword, eventCode, status, sendKind, page, pageSize]);
  return <>
    <div className="email-toolbar">
      <EmailSearch value={search} onChange={value => { setSearch(value); setPage(1); }} />
      <EmailEventSelect schoolId={schoolId} events={events} value={eventCode} onChange={value => { setEventCode(value); setPage(1); }} />
      <SelectField label="Trạng thái người nhận" value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="">Tất cả</option>{Object.entries(statuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</SelectField>
      <SelectField label="Loại gửi" value={sendKind} onChange={e => { setSendKind(e.target.value); setPage(1); }}><option value="">Tất cả</option><option value="AUTOMATIC">Tự động</option><option value="MANUAL">Thủ công / đặt lịch</option><option value="TEST">Email thử</option></SelectField>
      <PcbButton variant="secondary" onClick={list.reload}>Làm mới</PcbButton>
    </div>
    <section className="email-panel" aria-label="Lịch sử gửi email">
      <EmailState {...list} count={list.data?.items.length ?? 0} />
      {!!list.data?.items.length && <div className="pcb-table-wrap"><table className="pcb-table"><thead><tr><th>Email</th><th>Thời gian</th><th>Kết quả gửi</th><th>Thao tác</th></tr></thead>
        <tbody>{list.data.items.map(item => <tr key={item.id}><td><strong>{item.title}</strong><div className="sep-subline">{item.isTest ? 'Email thử' : events.find(event => event.code === item.eventCode)?.name ?? item.eventCode} · {item.sendKind === 'MANUAL' ? 'Thủ công' : item.sendKind === 'AUTOMATIC' ? 'Tự động' : 'Gửi thử'}</div></td>
          <td>{emailDateTime(item.createdAt)}{item.scheduledFor && <div className="sep-subline">Lịch gửi: {emailDateTime(item.scheduledFor)}</div>}</td><td>{item.sentCount}/{item.recipientCount} đã gửi<div className="sep-subline">{item.pendingCount} chờ · {item.errorCount} lỗi · {item.cancelledCount} hủy</div></td>
          <td><div className="email-actions"><PcbButton variant="secondary" size="sm" onClick={() => setSelected(item.id)}>Xem chi tiết</PcbButton>
            {item.canCancel && <PcbButton variant="danger" size="sm" disabled={busy} onClick={() => notice.confirm('Hủy lần gửi này? Nội dung và lịch sử vẫn được giữ.', () => {
              void run(async () => { try { await api.email.cancel(schoolId, item.id, item.version); list.reload(); } catch (error) { notice.error(problemLines(toProblem(error))); } });
            }, 'Hủy lần gửi')}>Hủy gửi</PcbButton>}</div></td></tr>)}</tbody></table></div>}
      <EmailPager data={list.data} page={page} pageSize={pageSize} setPage={setPage} setPageSize={setPageSize} label="email" />
    </section>
    {selected !== null && <HistoryDetail schoolId={schoolId} id={selected} onClose={() => setSelected(null)} />}
    {notice.dialog}
  </>;
}

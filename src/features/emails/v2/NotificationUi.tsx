import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Icon, PcbButton } from '../../../components/pcb';
import { problemLines, toProblem } from '../../../utils/problem';

export function NotificationDialog({ title, children, onClose, busy = false, wide = false }: { title: string; children: ReactNode; onClose: () => void; busy?: boolean; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog className={`nt-admin__dialog${wide ? ' nt-admin__dialog--wide' : ''}`} ref={ref} aria-labelledby={id} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="nt-admin__dialog-head"><h2 id={id}>{title}</h2><PcbButton variant="ghost" disabled={busy} onClick={onClose} aria-label="Đóng hộp thoại"><Icon name="close" size={20} /></PcbButton></div>
    {children}
  </dialog>;
}

export function RequestState({ loading, error, empty = false, onRetry, children }: { loading: boolean; error: unknown; empty?: boolean; onRetry: () => void; children?: ReactNode }) {
  if (loading) return <div className="nt-admin__state" role="status"><Icon name="hourglass_empty" size={24} /><p>Đang tải dữ liệu…</p></div>;
  if (error) return <div className="nt-admin__state nt-admin__state--error" role="alert"><Icon name="error_outline" size={28} /><p>{problemLines(toProblem(error)).join(' ')}</p><PcbButton variant="secondary" onClick={onRetry}>Thử lại</PcbButton></div>;
  if (empty) return <div className="nt-admin__state"><Icon name="inbox" size={32} /><p>Chưa có dữ liệu phù hợp.</p>{children}</div>;
  return null;
}

const labels: Record<string, string> = {
  ARCHIVED: 'Đã lưu trữ', RETRY_WAIT: 'Chờ thử lại', NONE: 'Không chọn',
  ACTIVE: 'Đang áp dụng', INACTIVE: 'Ngừng áp dụng', QUEUED: 'Chờ xử lý', PENDING: 'Chờ gửi', SCHEDULED: 'Đã đặt lịch', PROCESSING: 'Đang xử lý', SENDING: 'Đang gửi', SENT: 'Máy chủ đã tiếp nhận', ACCEPTED: 'Máy chủ đã tiếp nhận', PUBLISHED: 'Đã hiển thị', COMPLETED: 'Hoàn tất', PARTIAL: 'Hoàn tất một phần', FAILED: 'Gửi lỗi', ERROR: 'Gửi lỗi', UNKNOWN: 'Chưa xác định', CANCELLED: 'Đã hủy', SKIPPED: 'Bỏ qua', NO_EMAIL: 'Chưa có email', READY: 'Sẵn sàng', DISABLED: 'Đang tắt', IN_APP: 'Trong ứng dụng', EMAIL: 'Gmail', AUTOMATIC: 'Tự động', MANUAL: 'Thủ công', TEST: 'Gửi thử', UNREAD: 'Chưa đọc', READ: 'Đã đọc',
};
export function NotificationStatus({ value }: { value: string }) {
  const tone = ['ACTIVE', 'READY', 'COMPLETED', 'SENT', 'ACCEPTED', 'PUBLISHED', 'READ'].includes(value) ? 'green' : ['ERROR', 'FAILED'].includes(value) ? 'red' : ['UNKNOWN', 'PARTIAL', 'NO_EMAIL'].includes(value) ? 'amber' : ['QUEUED', 'PENDING', 'SCHEDULED', 'PROCESSING', 'SENDING', 'UNREAD'].includes(value) ? 'blue' : 'gray';
  return <span className={`nt-admin__badge nt-admin__badge--${tone}`}>{labels[value] ?? value}</span>;
}

export function MessagePreview({ subject, content, inAppBody, channel = 'EMAIL' }: { subject: string; content: string; inAppBody?: string | null; channel?: 'EMAIL' | 'IN_APP' }) {
  return <article className={`nt-admin__preview nt-admin__preview--${channel.toLowerCase()}`}>
    <div className="nt-admin__preview-label"><Icon name={channel === 'EMAIL' ? 'mail' : 'notifications'} size={18} />{channel === 'EMAIL' ? 'Bản xem trước email' : 'Thông báo trong ứng dụng'}</div>
    <h3>{subject || 'Tiêu đề thông báo'}</h3><p>{channel === 'IN_APP' ? inAppBody || subject : content || 'Nội dung thông báo sẽ hiển thị ở đây.'}</p>
  </article>;
}

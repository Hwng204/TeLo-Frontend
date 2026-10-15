import { useEffect, useRef } from 'react';
import { displayToast } from '../../utils/toast';
import { ConfirmDialog } from './ConfirmDialog';

export type Notice = {
  kind: 'error' | 'success' | 'confirm';
  messages: string[];
  confirmLabel?: string;
  onConfirm?: () => void;
};

/** Kết quả/lỗi dùng toast như đăng nhập; chỉ xác nhận thao tác mở hộp thoại. */
export const NoticeDialog = ({ notice, onClose }: { notice: Notice | null; onClose: () => void }) => {
  const shown = useRef<Notice | null>(null);
  useEffect(() => {
    if (!notice) { shown.current = null; return; }
    if (notice.kind === 'confirm' || shown.current === notice) return;
    shown.current = notice;
    displayToast(notice.kind, notice.kind === 'success' ? 'Thành công' : 'Lỗi', notice.messages, notice.kind === 'error' ? 6 : 3);
    onClose();
  }, [notice, onClose]);

  return <ConfirmDialog
    isOpen={notice?.kind === 'confirm'}
    title="Xác nhận"
    message={notice?.messages.map((message, index) => <p key={index}>{message}</p>)}
    confirmText={notice?.confirmLabel ?? 'Đồng ý'}
    type="info"
    onCancel={onClose}
    onConfirm={() => { const run = notice?.onConfirm; onClose(); run?.(); }}
  />;
};

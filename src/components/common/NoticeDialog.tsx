import { useEffect, useRef } from 'react';
import { Icon, PcbButton } from '../pcb';

export type Notice = {
  kind: 'error' | 'success' | 'confirm';
  /** Một hoặc nhiều dòng; nhiều dòng (lỗi nhập liệu) hiện dạng danh sách. */
  messages: string[];
  confirmLabel?: string;
  onConfirm?: () => void;
};

const ICON = { error: 'priority_high', success: 'check', confirm: 'question_mark' } as const;

/** Hộp thông báo giữa màn hình cho lỗi/ràng buộc/kết quả; thay cho dòng chữ nhỏ dưới ô nhập. */
export const NoticeDialog = ({ notice, onClose }: { notice: Notice | null; onClose: () => void }) => {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (notice && !dialog.open) dialog.showModal();
    if (!notice && dialog.open) dialog.close();
  }, [notice]);

  return (
    <dialog
      ref={ref}
      className="sep-dialog sep-notice"
      onCancel={onClose}
      onClose={onClose}
      onClick={(event) => event.target === ref.current && onClose()}
    >
      {notice && (
        <div className="sep-notice__body" role="alertdialog" aria-label={notice.messages[0]}>
          <button type="button" className="sep-notice__close" aria-label="Đóng" onClick={onClose}>
            <Icon name="close" size={20} />
          </button>
          <span className={`sep-notice__icon sep-notice__icon--${notice.kind}`}>
            <Icon name={ICON[notice.kind]} size={30} />
          </span>
          {notice.messages.length === 1 ? (
            <p className="sep-notice__text">{notice.messages[0]}</p>
          ) : (
            <ul className="sep-notice__list">
              {notice.messages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          )}
          {notice.kind === 'confirm' && (
            <div className="sep-notice__actions">
              <PcbButton variant="ghost" onClick={onClose}>
                Huỷ
              </PcbButton>
              <PcbButton
                onClick={() => {
                  const run = notice.onConfirm;
                  onClose();
                  run?.();
                }}
              >
                {notice.confirmLabel ?? 'Đồng ý'}
              </PcbButton>
            </div>
          )}
        </div>
      )}
    </dialog>
  );
};

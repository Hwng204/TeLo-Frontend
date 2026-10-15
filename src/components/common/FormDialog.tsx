import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { PcbIconButton } from '../pcb';

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  busy?: boolean;
  /** Dùng nút X tròn và tiêu đề riêng của màn Chương & Bài. */
  closeButton?: boolean;
  className?: string;
};

export const FormDialog = ({ open, title, onClose, children, busy = false, closeButton = false, className = '' }: Props) => {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      const trigger = document.activeElement;
      dialog.showModal();
      dialog.querySelector<HTMLElement>('input:not([type="hidden"]):not(:disabled), select:not(:disabled), textarea:not(:disabled), [role="combobox"]:not(:disabled)')?.focus();
      return () => {
        if (dialog.open) dialog.close();
        if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
      };
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog ref={ref} className={`sep-dialog ${className}`} aria-label={title} aria-busy={busy} onCancel={event => {
      event.preventDefault();
      if (!busy) onClose();
    }} onClose={(event) => {
      // StrictMode may replay the effect and reopen before the queued close event arrives.
      if (!event.currentTarget.open) onClose();
    }}>
      {open && (
        <div className="sep-dialog__body">
          {closeButton ? (
            <div className="sep-dialog__head">
              <h2 className="sep-dialog__title">{title}</h2>
              <button type="button" className="sep-dialog__close" aria-label="Đóng" disabled={busy} onClick={onClose}>
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="sep-dialog__header">
              <h2 className="sep-dialog__title">{title}</h2>
              <PcbIconButton icon="close" label="Đóng hộp thoại" disabled={busy} onClick={onClose} />
            </div>
          )}
          {children}
        </div>
      )}
    </dialog>
  );
};

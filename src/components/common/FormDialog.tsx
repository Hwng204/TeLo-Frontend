import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Hiện nút X tròn bên phải tiêu đề (mặc định không). */
  closeButton?: boolean;
  /** Lớp thêm vào `<dialog>` để màn riêng tự đổi giao diện. */
  className?: string;
};

export const FormDialog = ({ open, title, onClose, children, closeButton = false, className }: Props) => {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      const trigger = document.activeElement;
      dialog.showModal();
      // showModal focuses the first focusable element, which is the X when closeButton is on: start at the first field.
      if (closeButton) dialog.querySelector<HTMLElement>('input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [role="combobox"]:not(:disabled)')?.focus();
      return () => {
        if (dialog.open) dialog.close();
        if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
      };
    }
    if (!open && dialog.open) dialog.close();
  }, [open, closeButton]);
  return (
    <dialog ref={ref} className={className ? `sep-dialog ${className}` : 'sep-dialog'} aria-label={title} onClose={(event) => {
      // StrictMode may replay the effect and reopen before the queued close event arrives.
      if (!event.currentTarget.open) onClose();
    }}>
      {open && (
        <div className="sep-dialog__body">
          {closeButton ? (
            <div className="sep-dialog__head">
              <h2 className="sep-dialog__title">{title}</h2>
              <button type="button" className="sep-dialog__close" aria-label="Đóng" onClick={onClose}>
                <X size={16} />
              </button>
            </div>
          ) : (
            <h2 className="sep-dialog__title">{title}</h2>
          )}
          {children}
        </div>
      )}
    </dialog>
  );
};

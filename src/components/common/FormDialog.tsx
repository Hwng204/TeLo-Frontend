import { useEffect, useRef, type ReactNode } from 'react';
import { PcbIconButton } from '../pcb';

type Props = { open: boolean; title: string; onClose: () => void; children: ReactNode; busy?: boolean; className?: string };

export const FormDialog = ({ open, title, onClose, children, busy = false, className = '' }: Props) => {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      const trigger = document.activeElement;
      dialog.showModal();
      dialog.querySelector<HTMLElement>('input:not([type="hidden"]):not(:disabled), textarea:not(:disabled), [role="combobox"]:not(:disabled)')?.focus();
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
          <div className="sep-dialog__header">
            <h2 className="sep-dialog__title">{title}</h2>
            <PcbIconButton icon="close" label="Đóng hộp thoại" disabled={busy} onClick={onClose} />
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
};

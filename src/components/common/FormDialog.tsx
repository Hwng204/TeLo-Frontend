import { useEffect, useRef, type ReactNode } from 'react';

type Props = { open: boolean; title: string; onClose: () => void; children: ReactNode };

export const FormDialog = ({ open, title, onClose, children }: Props) => {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      const trigger = document.activeElement;
      dialog.showModal();
      return () => {
        if (dialog.open) dialog.close();
        if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
      };
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog ref={ref} className="sep-dialog" aria-label={title} onClose={(event) => {
      // StrictMode may replay the effect and reopen before the queued close event arrives.
      if (!event.currentTarget.open) onClose();
    }}>
      {open && (
        <div className="sep-dialog__body">
          <h2 className="sep-dialog__title">{title}</h2>
          {children}
        </div>
      )}
    </dialog>
  );
};

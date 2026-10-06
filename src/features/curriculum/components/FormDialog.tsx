import { useEffect, useRef, type ReactNode } from 'react';

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

/** Khung `<dialog>` dùng chung cho các form của màn chương & bài; mở/đóng theo `open`. */
export const FormDialog = ({ open, title, onClose, children }: Props) => {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} className="sep-dialog" aria-label={title} onCancel={onClose} onClose={onClose}>
      {open && (
        <div className="sep-dialog__body">
          <h2 className="sep-dialog__title">{title}</h2>
          {children}
        </div>
      )}
    </dialog>
  );
};

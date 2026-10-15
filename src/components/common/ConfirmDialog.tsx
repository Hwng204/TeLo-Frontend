import { type ReactNode, useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import './ConfirmDialog.css';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: ReactNode;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
    /** Chữ của nút xác nhận khi đang xử lý. */
    loadingText?: string;
    /** Lớp thêm vào `.confirm-dialog` để màn riêng tự đổi giao diện. */
    className?: string;
}

export const ConfirmDialog = ({
    isOpen,
    title,
    message,
    confirmText = 'Xác nhận',
    cancelText = 'Hủy',
    onConfirm,
    onCancel,
    type = 'danger',
    isLoading = false,
    loadingText = 'Đang xử lý...',
    className
}: ConfirmDialogProps) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const cancelRef = useRef<HTMLButtonElement>(null);
    const titleId = useId();
    const messageId = useId();

    // Mở: đặt con trỏ vào nút Hủy (lựa chọn an toàn). Đóng: trả con trỏ về nút đã mở hộp thoại.
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!isOpen || !dialog) return;
        const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        if (!dialog.open) dialog.showModal();
        cancelRef.current?.focus();
        return () => {
            if (dialog.open) dialog.close();
            if (opener?.isConnected) opener.focus();
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
            <dialog
                className={`sep-dialog confirm-dialog confirm-dialog--${type}${className ? ` ${className}` : ''}`}
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={messageId}
                aria-busy={isLoading}
                onCancel={event => { event.preventDefault(); if (!isLoading) onCancel(); }}
            >
                <div className="confirm-header">
                    <h3 id={titleId}>{title}</h3>
                    <button 
                        type="button" 
                        className="confirm-close"
                        aria-label="Đóng hộp thoại"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        <X size={20} />
                    </button>
                </div>
                <div id={messageId} className="confirm-body">
                    {message}
                </div>
                <div className="confirm-footer">
                    <button 
                        ref={cancelRef}
                        type="button" 
                        className="confirm-btn confirm-btn--cancel" 
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        {cancelText}
                    </button>
                    <button 
                        type="button" 
                        className={`confirm-btn confirm-btn--confirm confirm-btn--${type}`}
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? loadingText : confirmText}
                    </button>
                </div>
            </dialog>
    );
};

/** Nội dung chuẩn của hộp xác nhận xóa (dùng với className="sep-delete-confirm"). */
export const DeleteMessage = ({ subject, name }: { subject: string; name: string }) => (
    <>
        <p>{subject} "<strong>{name}</strong>" sẽ bị xóa khỏi hệ thống.</p>
        <p>Hành động này sẽ không thể hoàn tác.</p>
    </>
);

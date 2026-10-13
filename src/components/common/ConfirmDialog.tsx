import { type ReactNode, useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
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
    const dialogRef = useRef<HTMLDivElement>(null);
    const cancelRef = useRef<HTMLButtonElement>(null);
    const titleId = useId();

    // Mở: đặt con trỏ vào nút Hủy (lựa chọn an toàn). Đóng: trả con trỏ về nút đã mở hộp thoại.
    useEffect(() => {
        if (!isOpen) return;
        const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        cancelRef.current?.focus();
        return () => opener?.focus();
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isLoading) onCancel();
            // Giữ Tab vòng trong hộp thoại, không lọt ra trang phía sau.
            if (e.key === 'Tab' && dialogRef.current) {
                const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex="-1"])'));
                const first = items[0];
                const last = items[items.length - 1];
                const inside = dialogRef.current.contains(document.activeElement);
                if (!first) e.preventDefault();
                else if (e.shiftKey && (!inside || document.activeElement === first)) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && (!inside || document.activeElement === last)) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onCancel, isLoading]);

    if (!isOpen) return null;

    return createPortal(
        <div className="confirm-overlay" onClick={isLoading ? undefined : onCancel}>
            <div 
                className={`confirm-dialog confirm-dialog--${type}${className ? ` ${className}` : ''}`}
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                onClick={e => e.stopPropagation()}
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
                <div className="confirm-body">
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
            </div>
        </div>,
        document.body
    );
};

/** Nội dung chuẩn của hộp xác nhận xóa (dùng với className="sep-delete-confirm"). */
export const DeleteMessage = ({ subject, name }: { subject: string; name: string }) => (
    <>
        <p>{subject} "<strong>{name}</strong>" sẽ bị xóa khỏi hệ thống.</p>
        <p>Hành động này sẽ không thể hoàn tác.</p>
    </>
);

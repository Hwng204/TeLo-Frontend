import { type ReactNode, useEffect, useRef } from 'react';
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
    isLoading = false
}: ConfirmDialogProps) => {
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isLoading) onCancel();
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
                className={`confirm-dialog confirm-dialog--${type}`} 
                ref={dialogRef}
                onClick={e => e.stopPropagation()}
            >
                <div className="confirm-header">
                    <h3>{title}</h3>
                    <button 
                        type="button" 
                        className="confirm-close" 
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
                        {isLoading ? 'Đang xử lý...' : confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

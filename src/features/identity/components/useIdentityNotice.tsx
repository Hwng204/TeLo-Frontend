import { useState } from 'react';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { displayToast } from '../../../utils/toast';

type Confirmation = { message: string; onConfirm: () => void; label: string; danger: boolean };

/** Toast cho kết quả; chỉ mở hộp thoại khi cần xác nhận thao tác. */
export function useIdentityNotice() {
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const close = () => setConfirmation(null);
  return {
    success: (message: string) => displayToast('success', 'Thành công', message),
    error: (message: string) => displayToast('error', 'Lỗi', message, 5),
    confirm: (message: string, onConfirm: () => void, label = 'Đồng ý', danger = false) =>
      setConfirmation({ message, onConfirm, label, danger }),
    dialog: <ConfirmDialog
      isOpen={confirmation !== null}
      title="Xác nhận thao tác"
      message={confirmation?.message}
      confirmText={confirmation?.label}
      type={confirmation?.danger ? 'danger' : 'info'}
      onCancel={close}
      onConfirm={() => { const action = confirmation?.onConfirm; close(); action?.(); }}
    />,
  };
}

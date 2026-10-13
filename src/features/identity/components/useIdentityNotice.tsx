import { useState } from 'react';
import { Icon, PcbButton } from '../../../components/pcb';
import { displayToast } from '../../../utils/toast';
import { IdentityDialog } from './IdentityUi';

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
    dialog: confirmation && <IdentityDialog
      title="Xác nhận thao tác"
      icon={confirmation.danger ? 'warning' : 'help'}
      className={`identity-dialog--confirm${confirmation.danger ? ' identity-dialog--danger' : ''}`}
      onClose={close}
    >
      <p className="identity-confirm-message">{confirmation.message}</p>
      <div className="sep-actions">
        <PcbButton variant="secondary" onClick={close} autoFocus>Hủy</PcbButton>
        <PcbButton variant={confirmation.danger ? 'danger' : 'primary'} onClick={() => {
          const action = confirmation.onConfirm;
          close();
          action();
        }}><Icon name={confirmation.danger ? 'delete' : 'check'} />{confirmation.label}</PcbButton>
      </div>
    </IdentityDialog>,
  };
}

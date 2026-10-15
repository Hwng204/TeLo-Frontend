import { ConfirmDialog } from '../../../components/common/ConfirmDialog';

export type YearAction = 'ACTIVATE' | 'CLOSE';

export function AcademicYearActionDialog({ action, yearName, busy, onConfirm, onCancel }: {
  action: YearAction | null; yearName: string; busy: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  return <ConfirmDialog
    isOpen={action !== null}
    title={action === 'ACTIVATE' ? 'Áp dụng năm học' : 'Kết thúc năm học'}
    message={action === 'ACTIVATE'
      ? <>Áp dụng năm học <strong>{yearName}</strong>? Năm học đang áp dụng, nếu có sẽ tự động kết thúc.</>
      : <>Kết thúc năm học <strong>{yearName}</strong>? Năm học sẽ bị khóa chỉnh sửa.</>}
    confirmText={action === 'ACTIVATE' ? 'Áp dụng' : 'Kết thúc'}
    type={action === 'ACTIVATE' ? 'info' : 'danger'}
    isLoading={busy}
    onConfirm={onConfirm}
    onCancel={onCancel}
    className="academic-confirm-dialog"
  />;
}

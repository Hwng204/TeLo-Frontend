import { useEffect, useRef, useState } from 'react';
import { PcbButton } from '../../../components/pcb';

const MAX_COMMENT = 1000;

type Props = {
  open: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (comment: string) => void;
};

/**
 * Hộp nhập nhận xét khi PHT từ chối ma trận.
 * Figma chưa có màn này; backend đã hỗ trợ POST /matrices/{id}/reject với comment tuỳ chọn.
 */
export const RejectDialog = ({ open, busy, onCancel, onConfirm }: Props) => {
  const ref = useRef<HTMLDialogElement>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} className="sep-dialog" onCancel={onCancel} onClose={onCancel}>
      <div className="sep-dialog__body">
        <h2 className="sep-section-title">Từ chối ma trận</h2>
        <p className="sep-muted">
          Ma trận sẽ trở về trạng thái Nháp để Tổ trưởng chỉnh sửa. Nhận xét sẽ bị xoá khi ma trận được nộp lại.
        </p>
        <label className="pcb-label" htmlFor="reject-comment">
          Nhận xét (tuỳ chọn)
        </label>
        <textarea
          id="reject-comment"
          className="sep-textarea"
          value={comment}
          maxLength={MAX_COMMENT}
          placeholder="Nêu rõ điểm cần sửa để Tổ trưởng làm lại."
          onChange={(event) => setComment(event.target.value)}
        />
        <span className="sep-muted">
          {comment.length}/{MAX_COMMENT}
        </span>
        <div className="sep-actions">
          <PcbButton variant="ghost" onClick={onCancel}>
            Huỷ
          </PcbButton>
          {/* Trả ma trận về cho Tổ trưởng là hành động phủ định, không dùng nút xanh như một việc thông thường. */}
          <PcbButton variant="danger" disabled={busy} onClick={() => onConfirm(comment.trim())}>
            {busy ? 'Đang gửi…' : 'Từ chối'}
          </PcbButton>
        </div>
      </div>
    </dialog>
  );
};

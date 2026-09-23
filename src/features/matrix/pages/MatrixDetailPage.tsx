import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon, PcbButton } from '../../../components/pcb';
import { useAsync, useBusy } from '../../../hooks';
import { api } from '../../../services/api';
import type { Matrix, MatrixAction } from '../../../types';
import { contextLabel } from '../../../utils/academicContext';
import { saveBlob } from '../../../utils/download';
import { formatScore, gridTotal, REQUIRED_TOTAL_PERCENTAGE, toGrid } from '../../../utils/matrixGrid';
import { personLabel } from '../../../utils/formatters';
import { isPht, isTeamLead } from '../../../utils/jwt';
import { toProblem } from '../../../utils/problem';
import { InfoGrid, type InfoItem } from '../components/InfoGrid';
import { MatrixGrid } from '../components/MatrixGrid';
import { PageHeader } from '../components/PageHeader';
import { RejectDialog } from '../components/RejectDialog';
import '../matrix.css';

/** M03 / M03-A / M03-B chỉ khác nhau ở tiêu đề và cụm nút, mà cụm nút đọc từ allowedActions. */
const titleFor = (matrix: Matrix | undefined) => {
  if (!matrix) return 'Chi tiết ma trận';
  // Người nộp (Tổ trưởng) xem lại bản đã nộp không có gì để xác nhận.
  if (matrix.status === 'SUBMITTED' && matrix.allowedActions.some((action) => action === 'Approve' || action === 'Confirm')) {
    return 'Xác nhận ma trận';
  }
  if (matrix.status === 'APPROVED') return 'Ma trận đã hoàn thành';
  return 'Chi tiết ma trận';
};

export const MatrixDetailPage = () => {
  const navigate = useNavigate();
  const matrixId = Number(useParams().id);

  const [notice, setNotice] = useState<{ message: string; kind: 'error' | 'info' } | null>(null);
  const [busy, runExclusive] = useBusy();
  const [rejecting, setRejecting] = useState(false);

  const detail = useAsync(() => api.matrix.get(matrixId), [matrixId]);
  const matrix = detail.data;

  // Cần reference data của đúng ngữ cảnh mới có tiêu đề bài học; gọi lại khi ma trận tải xong.
  const reference = useAsync(
    () => api.matrix.referenceData(matrix?.academicContextId),
    [matrix?.academicContextId],
  );
  const contexts = reference.data?.academicContexts ?? [];
  const lessons = reference.data?.lessons ?? [];
  const semester = reference.data?.semesters.find((item) => item.id === matrix?.semesterId);

  const can = (action: MatrixAction) => matrix?.allowedActions.includes(action) ?? false;

  // Backend cấp `Submit` cho mọi PHT và `Delete` cho mọi PHT trong chi nhánh, còn ma trận
  // không lưu người tạo. Hai chặn dưới đây chỉ là ràng buộc phía giao diện, chưa đủ chặt.
  // ponytail: cần backend thêm createdByUserId + siết CanHardDelete/AllowedActions, xem báo cáo.
  const asPht = isPht() && !isTeamLead();
  // Tổ trưởng không vào được /matrices (RequireRole đẩy sang /dashboard), nên "về danh sách" của họ là danh sách nhiệm vụ.
  const listPath = isTeamLead() ? '/matrix-tasks' : '/matrices';
  // PHT không "nộp cho chính mình": họ dùng Xác nhận. Nộp là việc của Tổ trưởng.
  const canSubmit = can('Submit') && !asPht;
  // Ma trận gắn nhiệm vụ là của Tổ trưởng; PHT chỉ xoá được ma trận PHT tự tạo (taskId = null).
  const canDelete = can('Delete') && !(asPht && matrix?.taskId != null);

  const run = (
    action: () => Promise<unknown>,
    successMessage?: string,
    failureMessage?: string,
    // Xoá / Từ chối rời khỏi trang: tải lại chi tiết lúc đó chỉ nhận 404/403 vô ích.
    reload = true,
  ) =>
    runExclusive(async () => {
      setNotice(null);
      try {
        await action();
        if (reload) detail.reload();
        if (successMessage) setNotice({ message: successMessage, kind: 'info' });
      } catch (error) {
        const problem = toProblem(error);
        setNotice({ message: failureMessage ?? problem.message, kind: 'error' });
        // 409 nghĩa là người khác vừa đổi trạng thái; tải lại để allowedActions đúng trở lại.
        if (problem.status === 409) detail.reload();
        if (problem.status === 404 || problem.status === 403) navigate(listPath, { replace: true });
      }
    });

  const exportFile = () =>
    run(
      async () => {
        const { blob, filename } = await api.matrix.exportXlsx(matrixId);
        saveBlob(blob, filename);
      },
      undefined,
      'Không xuất được file. Vui lòng thử lại.',
    );

  const back = () => navigate(listPath);

  if (detail.loading || (matrix && reference.loading)) {
    return (
      <>
        <PageHeader title={titleFor(undefined)} onBack={back} />
        <p className="sep-empty" role="status">Đang tải…</p>
      </>
    );
  }

  const rows = matrix ? toGrid(matrix.details, lessons.map((lesson) => lesson.id)) : [];
  const totalPercentage = gridTotal(rows).percentage;

  if (!matrix) {
    return (
      <>
        <PageHeader title={titleFor(undefined)} onBack={back} />
        <div className="sep-page">
          <div className="sep-alert" role="alert">
            {detail.error ? toProblem(detail.error).message : 'Không tìm thấy ma trận.'}
          </div>
          <div className="sep-actions">
            <PcbButton variant="secondary" onClick={back}>
              Về danh sách
            </PcbButton>
          </div>
        </div>
      </>
    );
  }

  const items: InfoItem[] = [
    { label: 'Tên ma trận', value: matrix.name, span: 'full' },
    { label: 'Người lập', value: personLabel(matrix.createdBy), span: 'wide' },
    // Chỉ hiện khi ma trận đã qua bước duyệt và có ghi người duyệt.
    // Người tự lập rồi xác nhận thì không có ai "duyệt" ai: chỉ hiện khi người duyệt khác người lập.
    ...(matrix.approvedBy && matrix.approvedBy.userId !== matrix.createdBy?.userId
      ? [{ label: 'Xác nhận bởi', value: personLabel(matrix.approvedBy), span: 'wide' as const }]
      : []),
    { label: 'Phạm vi', value: contextLabel(contexts, matrix.academicContextId), span: 'wide' },
    { label: 'Học kỳ', value: semester?.name ?? 'Không chọn' },
    { label: 'Quy mô', value: `${matrix.totalQuestions} câu · ${formatScore(matrix.totalScore)} điểm` },
  ];

  return (
    <>
      <PageHeader
        title={titleFor(matrix)}
        onBack={back}
        badge={<span className={`sep-status sep-status--${matrix.status}`}>{matrix.statusLabel}</span>}
      />

      <div className="sep-page">
      {notice && (
        <div className={notice.kind === 'error' ? 'sep-alert' : 'sep-alert sep-alert--success'} role="alert">
          {notice.message}
        </div>
      )}

      {matrix.status === 'DRAFT' && can('Update') && Math.round(totalPercentage * 100) !== REQUIRED_TOTAL_PERCENTAGE * 100 && (
        // Nháp lưu ở mọi tổng %; nút Nộp/Xác nhận chỉ xuất hiện khi đủ 100%, nên phải nói rõ vì sao chưa thấy.
        <div className="sep-alert sep-alert--info" role="status">
          Tổng tỷ lệ điểm hiện là {formatScore(totalPercentage)}%/{REQUIRED_TOTAL_PERCENTAGE}%. Sửa cho đủ {REQUIRED_TOTAL_PERCENTAGE}%
          để có thể nộp hoặc xác nhận.
        </div>
      )}

      {matrix.rejectComment && (
        <div className="sep-alert sep-alert--warn" role="status">
          Ma trận đã bị từ chối: {matrix.rejectComment}
        </div>
      )}

      <section className="sep-section">
        <h2 className="sep-section-title">Thông tin ma trận</h2>
        <InfoGrid items={items} />
      </section>

      <section className="sep-section">
        <h2 className="sep-section-title">Nội dung và mức nhận thức</h2>
        <MatrixGrid readOnly rows={rows} lessons={lessons} matrixTotalScore={matrix.totalScore} />
      </section>

      <div className="sep-actions">
        {/* Việc phụ (xuất, sửa) dồn trái; bên phải chỉ còn các quyết định, để Từ chối và Xác nhận đứng cạnh nhau. */}
        <div className="sep-actions__lead">
          {can('Export') && (
            <PcbButton variant="secondary" disabled={busy} onClick={exportFile}>
              <Icon name="download" size={20} />
              Xuất Excel
            </PcbButton>
          )}
          {can('Update') && (
            <PcbButton variant="ghost" disabled={busy} onClick={() => navigate(`/matrices/${matrixId}/edit`)}>
              <Icon name="edit" size={20} />
              Sửa
            </PcbButton>
          )}
        </div>
        {can('Clone') && (
          <PcbButton
            variant="secondary"
            disabled={busy}
            onClick={() =>
              run(async () => {
                const clone = await api.matrix.clone(matrixId);
                navigate(`/matrices/${clone.id}/edit`);
              })
            }
          >
            Tạo phiên bản mới
          </PcbButton>
        )}
        {canDelete && (
          <PcbButton
            variant="danger"
            disabled={busy}
            onClick={() => {
              if (!window.confirm('Xoá ma trận này? Thao tác không thể hoàn tác.')) return;
              void run(
                async () => {
                  await api.matrix.remove(matrixId);
                  navigate(listPath, { replace: true });
                },
                undefined,
                undefined,
                false,
              );
            }}
          >
            Xoá
          </PcbButton>
        )}
        {can('Archive') && (
          <PcbButton variant="secondary" disabled={busy} onClick={() => run(() => api.matrix.archive(matrixId), 'Đã lưu trữ ma trận.')}>
            Lưu trữ
          </PcbButton>
        )}
        {can('Reject') && (
          <PcbButton variant="danger" disabled={busy} onClick={() => setRejecting(true)}>
            Từ chối
          </PcbButton>
        )}
        {canSubmit && (
          <PcbButton disabled={busy} onClick={() => run(() => api.matrix.submit(matrixId), 'Đã nộp ma trận.')}>
            Nộp Phó Hiệu trưởng
          </PcbButton>
        )}
        {can('Confirm') && (
          <PcbButton disabled={busy} onClick={() => run(() => api.matrix.confirm(matrixId), 'Ma trận đã được xác nhận.')}>
            Xác nhận ma trận
          </PcbButton>
        )}
        {can('Approve') && (
          <PcbButton disabled={busy} onClick={() => run(() => api.matrix.approve(matrixId), 'Ma trận đã được duyệt.')}>
            Xác nhận ma trận
          </PcbButton>
        )}
      </div>

      <RejectDialog
        open={rejecting}
        busy={busy}
        onCancel={() => setRejecting(false)}
        onConfirm={(comment) => {
          setRejecting(false);
          // Sau khi từ chối, ma trận về Nháp của Tổ trưởng và PHT không còn xem được: quay về danh sách.
          void run(
            async () => {
              await api.matrix.reject(matrixId, comment || undefined);
              navigate(listPath, { replace: true });
            },
            undefined,
            undefined,
            false,
          );
        }}
      />
      </div>
    </>
  );
};

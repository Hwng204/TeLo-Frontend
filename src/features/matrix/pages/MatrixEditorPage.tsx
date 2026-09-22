import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Field, PcbButton, PcbIconButton } from '../../../components/pcb';
import { useAsync, useBusy } from '../../../hooks';
import { api } from '../../../services/api';
import type { GridRow, SaveMatrixRequest } from '../../../types';
import { contextLabel, resolveContextId, selectionFromContext } from '../../../utils/academicContext';
import type { ContextSelection } from '../../../utils/academicContext';
import { clearDraft, draftKeyFor, loadDraft, saveDraft } from '../../../utils/draftStorage';
import {
  formatScore,
  gridTotal,
  hasRequiredTotal,
  liveCellErrors,
  REQUIRED_TOTAL_SCORE,
  requireNonEmpty,
  toDetails,
  toGrid,
  totalScoreHint,
  validateGrid,
  validateTotalForSubmit,
} from '../../../utils/matrixGrid';
import { toProblem } from '../../../utils/problem';
import { ContextSelects } from '../components/ContextSelects';
import { MatrixGrid } from '../components/MatrixGrid';
import { MatrixSummary } from '../components/MatrixSummary';
import '../matrix.css';

/**
 * Một trang phục vụ M02-D, M02-TL, M02-REVIEW (bước soạn) và M02-P, M02-TLP (bước xem lại).
 *
 * Bước xem lại là `?step=review` của chính trang này chứ không phải route riêng, để dữ liệu
 * chưa lưu không phải đi qua route khác (đi qua sẽ mất khi người dùng bấm F5).
 */
export const MatrixEditorPage = () => <MatrixEditor key={useLocation().pathname} />;

const MatrixEditor = () => {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const matrixId = params.id ? Number(params.id) : null;
  const taskId = params.taskId ? Number(params.taskId) : null;
  const reviewing = searchParams.get('step') === 'review';

  const [problem, setProblem] = useState<string | null>(null);
  // Lỗi từ server (400 ValidationError) gắn theo field; lỗi cục bộ tính lại mỗi lần render.
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  // Chưa bấm nút lần nào thì chỉ báo lỗi các ô đã có giá trị (đang gõ), không la ô còn trống.
  const [attempted, setAttempted] = useState(false);
  // Đã thử Nộp/Xác nhận mà tổng chưa đủ 10: lúc đó mới tô đỏ ô Tổng điểm (lưu Nháp thì không bao giờ).
  const [totalRejected, setTotalRejected] = useState(false);
  const [busy, runExclusive] = useBusy();

  const detail = useAsync(async () => (matrixId ? api.matrix.get(matrixId) : null), [matrixId]);
  const matrix = detail.data;

  // Chưa ai chạm vào thì lấy giá trị từ server; chạm rồi thì giữ bản nháp của người dùng.
  // Bản nháp còn được lưu vào sessionStorage theo từng thay đổi, nên F5 không làm mất (xem draftStorage.ts).
  const draftKey = draftKeyFor(useLocation().pathname);
  const [restoredDraft] = useState(() => loadDraft(draftKey));
  const [draftName, setDraftName] = useState<string | null>(restoredDraft?.name ?? null);
  const [draftSelection, setDraftSelection] = useState<ContextSelection | null>(restoredDraft?.selection ?? null);
  const [draftRows, setDraftRows] = useState<GridRow[] | null>(restoredDraft?.rows ?? null);
  const [restored, setRestored] = useState(restoredDraft !== null);

  useEffect(() => {
    saveDraft(draftKey, { name: draftName, selection: draftSelection, rows: draftRows });
  }, [draftKey, draftName, draftSelection, draftRows]);

  const discardDraft = () => {
    clearDraft(draftKey);
    setDraftName(null);
    setDraftSelection(null);
    setDraftRows(null);
    setProblem(null);
    setServerErrors({});
    setAttempted(false);
    setTotalRejected(false);
    setRestored(false);
    if (reviewing) setSearchParams({});
  };

  // Hai lời gọi tách rời: danh sách ngữ cảnh không phụ thuộc gì, còn danh sách bài học
  // chỉ có khi đã biết academicContextId — mà id đó lại suy ra từ danh sách ngữ cảnh.
  const reference = useAsync(() => api.matrix.referenceData(), []);
  const contexts = reference.data?.academicContexts ?? [];
  const semesters = reference.data?.semesters ?? [];

  // Ma trận gắn nhiệm vụ: backend bỏ qua ngữ cảnh gửi lên và dùng ngữ cảnh của nhiệm vụ,
  // nên form phải điền sẵn và khoá lại, nếu không người dùng chọn sai sẽ nhận 422 InvalidReference.
  const task = useAsync(async () => (taskId ? api.matrixTask.get(taskId) : null), [taskId]);
  const delegated = Boolean(taskId ?? matrix?.taskId);

  const selection =
    draftSelection ??
    selectionFromContext(
      contexts,
      matrix?.academicContextId ?? task.data?.academicContextId ?? null,
      matrix?.semesterId ?? task.data?.semesterId,
    );
  const academicContextId = resolveContextId(contexts, selection);
  const name = draftName ?? matrix?.name ?? '';

  const lessonData = useAsync(
    async () => (academicContextId ? api.matrix.referenceData(academicContextId) : null),
    [academicContextId],
  );
  const lessons = useMemo(() => lessonData.data?.lessons ?? [], [lessonData.data]);

  const serverRows = useMemo(
    () => (matrix ? toGrid(matrix.details, lessons.map((lesson) => lesson.id)) : []),
    [matrix, lessons],
  );
  const rows = draftRows ?? serverRows;
  const total = gridTotal(rows);

  const buildRequest = (): SaveMatrixRequest => ({
    name: name.trim(),
    academicContextId: academicContextId!,
    semesterId: selection.semesterId ?? null,
    // Backend trả TaskImmutable nếu đổi taskId khi sửa, nên giữ nguyên giá trị đã lưu.
    taskId: matrix ? matrix.taskId : taskId,
    details: toDetails(rows),
  });

  const errors: Record<string, string> = {
    ...serverErrors,
    ...(attempted ? validateGrid(rows, name, academicContextId) : liveCellErrors(rows)),
  };
  if (totalRejected && !hasRequiredTotal(rows)) errors.total = validateTotalForSubmit(rows) ?? '';
  const totalOk = hasRequiredTotal(rows) && toDetails(rows).length > 0;
  // Sửa một ma trận Đã nộp: không có bước "lưu dở", tổng phải đúng 10 ngay khi lưu.
  const submittedEdit = matrix?.status === 'SUBMITTED';

  /**
   * `requireFull`: chỉ bật khi NỘP / XÁC NHẬN / sửa bản Đã nộp, lúc đó tổng phải đúng 10 và không rỗng.
   * Lưu Nháp thì không: nháp được lưu ở mọi tổng điểm để soạn dở dang nhiều lần.
   */
  const validate = (requireFull: boolean): boolean => {
    setAttempted(true);
    const found = validateGrid(rows, name, academicContextId);
    const empty = requireFull ? requireNonEmpty(rows) : null;
    const totalError = requireFull && !empty ? validateTotalForSubmit(rows) : null;
    setTotalRejected(requireFull && (Boolean(empty) || Boolean(totalError)));
    setProblem(
      empty ??
        totalError ??
        (Object.keys(found).length > 0 ? 'Vui lòng kiểm tra lại các ô được đánh dấu.' : null),
    );
    return Object.keys(found).length === 0 && !empty && !totalError;
  };

  const handleFailure = (error: unknown) => {
    const parsed = toProblem(error);
    setProblem(parsed.message);
    if (parsed.fieldErrors) setServerErrors(parsed.fieldErrors);
    if (parsed.status === 409) detail.reload();
    if (parsed.code === 'InvalidReference') {
      reference.reload();
      lessonData.reload();
    }
  };

  /** Lưu rồi chạy tiếp một hành động trên ma trận vừa lưu. */
  const save = (then?: (id: number) => Promise<unknown>, requireFull = false) => {
    if (!validate(requireFull)) return;

    return runExclusive(async () => {
      setProblem(null);

      let savedId: number;
      try {
        const saved = matrixId
          ? await api.matrix.update(matrixId, buildRequest())
          : await api.matrix.create(buildRequest());
        savedId = saved.id;
      } catch (error) {
        handleFailure(error);
        return;
      }

      // Ma trận đã nằm trong DB: bản nháp cục bộ hết ý nghĩa, dù bước tiếp theo (nộp/xác nhận) có lỗi hay không.
      clearDraft(draftKey);

      try {
        if (then) await then(savedId);
      } catch (error) {
        // Ma trận ĐÃ được lưu. Tuyệt đối không tạo lại, nếu không sẽ đẻ ra bản trùng.
        handleFailure(error);
      }
      navigate(`/matrices/${savedId}`, { replace: true });
    });
  };

  if (detail.loading) return <p className="sep-empty">Đang tải…</p>;

  // Chỉ khoá khi ĐÃ chọn xong ngữ cảnh và có dòng nội dung — nếu chưa chọn gì thì chưa
  // có gì để khoá, không thì người dùng thêm dòng trước sẽ không bao giờ chọn được ngữ cảnh.
  const lockContext = academicContextId !== null && rows.length > 0;
  const semesterName = semesters.find((item) => item.id === selection.semesterId)?.name;

  return (
    <>
      <div className="sep-page-header">
        <PcbIconButton
          icon="arrow_back"
          label="Quay lại"
          onClick={() => (reviewing ? setSearchParams({}) : navigate(-1))}
        />
        <h1 className="sep-page-title">
          {reviewing ? 'Xem lại ma trận' : matrixId ? 'Sửa ma trận' : 'Tạo ma trận'}
        </h1>
      </div>

      {problem && <div className="sep-alert" role="alert">{problem}</div>}

      {restored && (
        <div className="sep-alert sep-alert--info" role="status">
          Đã khôi phục bản nháp chưa lưu của bạn.
          <PcbButton variant="ghost" onClick={discardDraft}>
            Bỏ bản nháp
          </PcbButton>
        </div>
      )}

      {matrix?.rejectComment && (
        <div className="sep-alert sep-alert--warn" role="status">
          Phó Hiệu trưởng đã từ chối: {matrix.rejectComment}
        </div>
      )}

      {reviewing && !totalOk && (
        <div className="sep-alert sep-alert--warn" role="status">
          Tổng điểm hiện là {formatScore(total.score)}/{REQUIRED_TOTAL_SCORE}.{' '}
          {submittedEdit
            ? // Ma trận Đã nộp không lưu dở được: nút Lưu thay đổi bị khoá cho tới khi đủ điểm.
              `Ma trận đã nộp nên phải đủ ${REQUIRED_TOTAL_SCORE} điểm mới lưu được thay đổi.`
            : `Bạn vẫn lưu nháp được; cần đúng ${REQUIRED_TOTAL_SCORE} điểm mới ${delegated ? 'nộp được' : 'nộp hoặc tạo ma trận'}.`}
        </div>
      )}

      {reviewing ? (
        <MatrixSummary
          rows={[
            ['Ma trận', name || '—'],
            ['Phạm vi', `${contextLabel(contexts, academicContextId)}${semesterName ? ` · ${semesterName}` : ''}`],
            ['Quy mô', `${total.questions} câu · ${formatScore(total.score)} điểm`],
          ]}
        />
      ) : (
        <>
          <div className="sep-actions">
            <PcbButton variant="secondary" disabled title="Sắp có">
              Nhập Excel
            </PcbButton>
          </div>

          <div className="pcb-card sep-form">
            <Field
              label="Tên ma trận"
              value={name}
              error={errors.name}
              placeholder="Ví dụ: Toán 5 · Cuối học kỳ I"
              onChange={(event) => setDraftName(event.target.value)}
            />
            <Field
              label="Tổng điểm"
              value={`${total.questions} câu · ${formatScore(total.score)} / ${REQUIRED_TOTAL_SCORE} điểm`}
              error={errors.total}
              hint={totalScoreHint(rows) ?? undefined}
              readOnly
              title="Tổng do hệ thống tính từ các dòng chi tiết"
            />
          </div>

          <div className="pcb-card sep-card-body">
            <ContextSelects
              contexts={contexts}
              semesters={semesters}
              value={selection}
              emptyLabel="Chọn…"
              error={errors.academicContextId}
              disabled={lockContext || delegated}
              semesterDisabled={delegated}
              disabledHint={
                delegated
                  ? 'Ngữ cảnh do nhiệm vụ được giao quy định'
                  : 'Xoá hết dòng chi tiết trước khi đổi ngữ cảnh'
              }
              onChange={setDraftSelection}
            />
          </div>
        </>
      )}

      <h2 className="sep-section-title">Nội dung và mức nhận thức</h2>

      {!reviewing && !academicContextId && (
        <div className="sep-alert sep-alert--info">
          Chọn đủ Chương trình, Môn học, Khối lớp và Năm học để hiện danh sách bài học.
        </div>
      )}

      <MatrixGrid
        rows={rows}
        lessons={lessons}
        readOnly={reviewing}
        errors={errors}
        onChange={setDraftRows}
      />

      <div className="sep-actions">
        {reviewing ? (
          <>
            <PcbButton variant="ghost" onClick={() => setSearchParams({})}>
              Chỉnh sửa
            </PcbButton>

            {matrixId ? (
              // Ma trận đang Đã nộp thì sửa xong vẫn phải đúng 10; ma trận Nháp thì lưu ở mọi tổng.
              <PcbButton
                disabled={busy || (submittedEdit && !totalOk)}
                title={submittedEdit && !totalOk ? `Cần đúng ${REQUIRED_TOTAL_SCORE} điểm mới lưu được` : undefined}
                onClick={() => void save(undefined, submittedEdit)}
              >
                Lưu thay đổi
              </PcbButton>
            ) : (
              <>
                <PcbButton variant="secondary" disabled={busy} onClick={() => void save()}>
                  Lưu nháp
                </PcbButton>
                {taskId ? (
                  <PcbButton
                    disabled={busy || !totalOk}
                    title={totalOk ? undefined : `Cần đúng ${REQUIRED_TOTAL_SCORE} điểm mới nộp được`}
                    onClick={() => void save((id) => api.matrix.submit(id), true)}
                  >
                    Nộp Phó Hiệu trưởng
                  </PcbButton>
                ) : (
                  // PHT tự tạo: backend cần tạo Nháp rồi xác nhận, người dùng chỉ thấy kết quả đã duyệt.
                  <PcbButton
                    disabled={busy || !totalOk}
                    title={totalOk ? undefined : `Cần đúng ${REQUIRED_TOTAL_SCORE} điểm mới tạo được`}
                    onClick={() => void save((id) => api.matrix.confirm(id), true)}
                  >
                    Tạo ma trận
                  </PcbButton>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <PcbButton
              variant="ghost"
              onClick={() => {
                clearDraft(draftKey);
                navigate(-1);
              }}
            >
              Huỷ
            </PcbButton>
            <PcbButton
              disabled={busy}
              onClick={() => {
                if (validate(false)) setSearchParams({ step: 'review' });
              }}
            >
              Xem toàn bộ ma trận
            </PcbButton>
          </>
        )}
      </div>
    </>
  );
};

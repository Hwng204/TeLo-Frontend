import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Field, Icon, PcbButton } from '../../../components/pcb';
import { useAsync, useBusy, useOnline, type ArrivalState } from '../../../hooks';
import { api } from '../../../services/api';
import type { GridRow, MatrixImportPreview, SaveMatrixRequest } from '../../../types';
import { contextLabel, resolveContextId, selectionFromContext } from '../../../utils/academicContext';
import type { ContextSelection } from '../../../utils/academicContext';
import { clearDraft, draftKeyFor, isDraftStale, loadDraft, saveDraft, serverFingerprint } from '../../../utils/draftStorage';
import { canGoBack } from '../../../utils/history';
import {
  formatScore,
  gridTotal,
  hasRequiredTotal,
  liveCellErrors,
  REQUIRED_TOTAL_PERCENTAGE,
  requireNonEmpty,
  rowErrorKey,
  toDetails,
  toGrid,
  totalScoreHint,
  validateGrid,
  validateTotalForSubmit,
  validateTotalScoreField,
} from '../../../utils/matrixGrid';
import { toProblem } from '../../../utils/problem';
import { ContextSelects } from '../components/ContextSelects';
import { ExcelImportPanel } from '../components/ExcelImportPanel';
import { InfoGrid } from '../../../components/common/InfoGrid';
import { MatrixGrid } from '../components/MatrixGrid';
import { PageHeader } from '../../../components/common/PageHeader';
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
  const location = useLocation();
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
  // Mất mạng thì khoá các nút lưu; nội dung đang soạn vẫn nằm trong bản nháp cục bộ.
  const online = useOnline();
  const saveBlocked = busy || !online;
  // Lần tạo trước không nhận được phản hồi: có thể máy chủ đã tạo rồi, tạo lại sẽ ra bản trùng.
  const [createUnsure, setCreateUnsure] = useState(false);

  const detail = useAsync(async () => (matrixId ? api.matrix.get(matrixId) : null), [matrixId]);
  const matrix = detail.data;

  // Chưa ai chạm vào thì lấy giá trị từ server; chạm rồi thì giữ bản nháp của người dùng.
  // Bản nháp còn được lưu vào localStorage theo từng thay đổi, nên F5, đóng tab hay mất mạng không làm mất (xem draftStorage.ts).
  const draftKey = draftKeyFor(location.pathname);
  const [restoredDraft, setRestoredDraft] = useState(() => loadDraft(draftKey));
  const [draftName, setDraftName] = useState<string | null>(restoredDraft?.name ?? null);
  const [draftSelection, setDraftSelection] = useState<ContextSelection | null>(restoredDraft?.selection ?? null);
  const [draftRows, setDraftRows] = useState<GridRow[] | null>(restoredDraft?.rows ?? null);
  const [draftTotalScore, setDraftTotalScore] = useState<number | null>(restoredDraft?.totalScore ?? null);
  const [restored, setRestored] = useState(restoredDraft !== null);
  const [staleDraft, setStaleDraft] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  // Xét một lần, khi bản server vừa tải: bản nháp soạn trên bản cũ hơn (có người lưu sau đó) thì bỏ, giữ bản server,
  // nếu không bấm Lưu sẽ ghi đè nội dung người khác. Ma trận mới (chưa có trên server) khôi phục như thường.
  if (matrix && restoredDraft) {
    setRestoredDraft(null);
    if (isDraftStale(restoredDraft, matrix)) {
      setDraftName(null);
      setDraftSelection(null);
      setDraftRows(null);
      setDraftTotalScore(null);
      setRestored(false);
      setStaleDraft(true);
    }
  }
  // Bản server mà bản nháp đang dựa vào; lúc chưa tải xong thì giữ dấu cũ của bản nháp vừa khôi phục.
  const draftBase = matrix ? serverFingerprint(matrix) : (restoredDraft?.base ?? null);

  useEffect(() => {
    // Bản server đang tải (lại): chưa biết bản nháp dựa vào bản nào, đừng ghi đè dấu đã lưu bằng null.
    if (matrixId && draftBase === null) return;
    saveDraft(draftKey, { name: draftName, selection: draftSelection, rows: draftRows, totalScore: draftTotalScore, base: draftBase });
  }, [matrixId, draftKey, draftName, draftSelection, draftRows, draftTotalScore, draftBase]);

  const discardDraft = () => {
    clearDraft(draftKey);
    setDraftName(null);
    setDraftSelection(null);
    setDraftRows(null);
    setDraftTotalScore(null);
    setProblem(null);
    setServerErrors({});
    setAttempted(false);
    setTotalRejected(false);
    setRestored(false);
    setImportNotice(null);
    if (reviewing) setSearchParams({});
  };

  // Hai lời gọi tách rời: danh sách ngữ cảnh không phụ thuộc gì, còn danh sách bài học
  // chỉ có khi đã biết academicContextId — mà id đó lại suy ra từ danh sách ngữ cảnh.
  const task = useAsync(async () => (taskId ? api.matrixTask.get(taskId) : null), [taskId]);
  const reference = useAsync(() => api.matrix.referenceData(), []);
  const contexts = reference.data?.academicContexts ?? [];

  // Ma trận gắn nhiệm vụ: backend bỏ qua ngữ cảnh gửi lên và dùng ngữ cảnh của nhiệm vụ,
  // nên form phải điền sẵn và khoá lại, nếu không người dùng chọn sai sẽ nhận 422 InvalidReference.
  const delegated = Boolean(taskId ?? matrix?.taskId);

  const selection =
    draftSelection ??
    selectionFromContext(
      contexts,
      matrix?.academicContextId ?? task.data?.academicContextId ?? null,
    );
  const academicContextId = resolveContextId(contexts, selection);
  const name = draftName ?? matrix?.name ?? '';
  // Số nguyên dương do người lập tự đặt; gợi ý mặc định 10 cho ma trận mới.
  const totalScore = draftTotalScore ?? matrix?.totalScore ?? 10;

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
    // Backend trả TaskImmutable nếu đổi taskId khi sửa, nên giữ nguyên giá trị đã lưu.
    taskId: matrix ? matrix.taskId : taskId,
    totalScore,
    details: toDetails(rows),
  });

  const errors: Record<string, string> = {
    ...serverErrors,
    ...(attempted ? validateGrid(rows, name, academicContextId) : liveCellErrors(rows)),
  };
  // Bài đã lưu trữ không còn trong danh sách bài học (server sẽ trả 422 chung chung): chỉ rõ dòng phải xoá.
  if (lessonData.data) {
    for (const row of rows) {
      if (row.lessonId && !lessons.some((lesson) => lesson.id === row.lessonId)) {
        errors[rowErrorKey(row.key)] = 'Bài học đã được lưu trữ, hãy xoá dòng này.';
      }
    }
  }
  if (totalRejected && !hasRequiredTotal(rows)) errors.total = validateTotalForSubmit(rows) ?? '';
  const totalScoreError = validateTotalScoreField(totalScore);
  if (attempted && totalScoreError) errors.totalScore = totalScoreError;
  const totalOk = hasRequiredTotal(rows) && toDetails(rows).length > 0 && !totalScoreError;
  // Sửa một ma trận Đã nộp: không có bước "lưu dở", tổng phải đúng 100% ngay khi lưu.
  const submittedEdit = matrix?.status === 'SUBMITTED';

  /**
   * `requireFull`: chỉ bật khi NỘP / XÁC NHẬN / sửa bản Đã nộp, lúc đó tổng % phải đúng 100 và không rỗng.
   * Lưu Nháp thì không: nháp được lưu ở mọi tổng % để soạn dở dang nhiều lần.
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
        totalScoreError ??
        found.totalQuestions ??
        (Object.keys(found).length > 0 ? 'Vui lòng kiểm tra lại các ô được đánh dấu.' : null),
    );
    const ok = Object.keys(found).length === 0 && !empty && !totalError && !totalScoreError;
    // Bước xem lại không có ô nhập: quay về bước soạn để thấy các ô được đánh dấu.
    if (!ok && reviewing) setSearchParams({}, { replace: true });
    return ok;
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
    if (
      !matrixId &&
      createUnsure &&
      !window.confirm(
        'Lần lưu trước không nhận được phản hồi nên ma trận có thể đã được tạo. ' +
          'Hãy kiểm tra danh sách Ma trận đề trước. Vẫn tạo mới?',
      )
    ) return;

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
        if (!matrixId && toProblem(error).status === 0) {
          setCreateUnsure(true);
          setProblem('Không nhận được phản hồi từ máy chủ. Ma trận có thể đã được lưu: kiểm tra danh sách Ma trận đề trước khi lưu lại.');
        }
        return;
      }

      // Ma trận đã nằm trong DB: bản nháp cục bộ hết ý nghĩa, dù bước tiếp theo (nộp/xác nhận) có lỗi hay không.
      clearDraft(draftKey);

      let notice: string | undefined;
      try {
        if (then) await then(savedId);
      } catch (error) {
        // Ma trận ĐÃ được lưu. Tuyệt đối không tạo lại, nếu không sẽ đẻ ra bản trùng.
        // Lỗi nộp/xác nhận mang sang trang chi tiết, nếu không người dùng tưởng đã nộp xong.
        // `then` chỉ là Nộp (lập theo nhiệm vụ) hoặc Xác nhận (PHT tự tạo).
        notice = `Ma trận đã được lưu nhưng ${taskId ? 'chưa nộp' : 'chưa được xác nhận'}: ${toProblem(error).message}`;
      }
      navigate(`/matrices/${savedId}`, { replace: true, state: { notice, fromEditor: true } satisfies ArrivalState });
    });
  };

  /** Đổ nội dung file Excel vào bảng soạn; vẫn là bản nháp, phải qua "Xem toàn bộ ma trận" mới lưu. */
  const applyImport = (result: MatrixImportPreview) => {
    if (rows.length > 0 && !window.confirm('Thay các dòng đang có trong bảng bằng nội dung từ file Excel?')) return;
    setDraftRows(toGrid(result.details, lessons.map((lesson) => lesson.id)));
    if (result.name && !name.trim()) setDraftName(result.name);
    if (result.totalScore) setDraftTotalScore(result.totalScore);
    setImportOpen(false);
    setImportNotice(
      `Đã đưa ${result.lessonCount} bài học từ tệp Excel vào bảng ma trận.`,
    );
  };

  const title = reviewing ? 'Xem lại ma trận' : matrixId ? 'Sửa ma trận' : 'Tạo ma trận';
  const back = () => {
    if (reviewing) {
      // Bước xem lại là một mục lịch sử đẩy từ bước soạn: lùi lại thay vì đẩy thêm; mở thẳng link xem lại thì thay tại chỗ.
      if (canGoBack()) navigate(-1);
      else setSearchParams({}, { replace: true });
      return;
    }
    // Đánh dấu để ← ở chi tiết ma trận không lùi về lại màn soạn này.
    navigate(matrixId ? `/matrices/${matrixId}` : taskId ? `/matrix-tasks/${taskId}` : '/matrices', {
      state: { fromEditor: true } satisfies ArrivalState,
    });
  };

  // Bài học chỉ chặn cả trang ở lần mở ma trận/nhiệm vụ có sẵn; đổi phạm vi trên form thì giữ form, nút "Thêm nội dung" tự khoá.
  if (detail.loading || reference.loading || (taskId && task.loading) || (academicContextId && lessonData.loading && !draftSelection)) {
    return (
      <>
        <PageHeader title={title} onBack={back} />
        <p className="sep-empty" role="status">Đang tải…</p>
      </>
    );
  }

  if (taskId && !task.data) {
    return (
      <>
        <PageHeader title={title} onBack={() => navigate('/matrix-tasks')} />
        <div className="sep-page">
          <div className="sep-alert" role="alert">{task.error ? toProblem(task.error).message : 'Không tìm thấy nhiệm vụ.'}</div>
        </div>
      </>
    );
  }

  // Nhiệm vụ đã có ma trận (Back trình duyệt sau khi nộp, link cũ): lập lại chỉ nhận 409, mở ma trận đó.
  if (taskId && task.data?.matrixId) return <Navigate to={`/matrices/${task.data.matrixId}`} replace />;

  if (matrixId && (!matrix || !matrix.allowedActions.includes('Update'))) {
    return (
      <>
        <PageHeader title={title} onBack={back} />
        <div className="sep-page">
          <div className="sep-alert" role="alert">
            {!matrix ? (detail.error ? toProblem(detail.error).message : 'Không tìm thấy ma trận.') :
              'Bạn không thể chỉnh sửa ma trận ở trạng thái hiện tại.'}
          </div>
        </div>
      </>
    );
  }

  // Chỉ khoá khi ĐÃ chọn xong ngữ cảnh và có dòng nội dung — nếu chưa chọn gì thì chưa
  // có gì để khoá, không thì người dùng thêm dòng trước sẽ không bao giờ chọn được ngữ cảnh.
  const lockContext = academicContextId !== null && rows.length > 0;

  return (
    <>
      <PageHeader title={title} onBack={back} />

      <div className="sep-page">
      {problem && <div className="sep-alert" role="alert">{problem}</div>}

      {!online && (
        <div className="sep-alert sep-alert--warn" role="status">
          Mất kết nối mạng. Nội dung đang soạn vẫn được giữ trên máy này, có mạng lại thì lưu tiếp.
        </div>
      )}

      {staleDraft && (
        <div className="sep-alert sep-alert--info" role="status">
          Ma trận đã được cập nhật sau lần bạn soạn trước; đang hiển thị bản mới nhất, bản nháp trên máy đã bỏ.
        </div>
      )}

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
          Tổng tỷ lệ điểm hiện là {formatScore(total.percentage)}%/{REQUIRED_TOTAL_PERCENTAGE}%.{' '}
          {submittedEdit
            ? // Ma trận Đã nộp không lưu dở được: nút Lưu thay đổi bị khoá cho tới khi đủ %.
              `Ma trận đã nộp nên phải đủ ${REQUIRED_TOTAL_PERCENTAGE}% mới lưu được thay đổi.`
            : `Bạn vẫn lưu nháp được; cần đúng ${REQUIRED_TOTAL_PERCENTAGE}% mới ${delegated ? 'nộp được' : 'nộp hoặc tạo ma trận'}.`}
        </div>
      )}

      {reviewing ? (
        <section className="sep-section">
          <h2 className="sep-section-title">Thông tin ma trận</h2>
          <InfoGrid
            items={[
              { label: 'Tên ma trận', value: name || '—', span: 'full' },
              { label: 'Phạm vi', value: contextLabel(contexts, academicContextId), span: 'wide' },
              {
                label: 'Quy mô',
                value: `${total.questions} câu · ${formatScore(totalScore)} điểm (${formatScore(total.percentage)}%)`,
              },
            ]}
          />
        </section>
      ) : (
        <>
          <section className="sep-section">
            <h2 className="sep-section-title">Thông tin ma trận</h2>
            <div className="sep-fields">
              <Field
                label="Tên ma trận"
                value={name}
                error={errors.name}
                placeholder="Ví dụ: Toán 5 · Cuối học kỳ I"
                fieldClassName="sep-span-2"
                onChange={(event) => setDraftName(event.target.value)}
              />
              <Field
                type="number"
                min={1}
                step={1}
                label="Tổng điểm"
                value={totalScore}
                error={errors.totalScore}
                hint={totalScoreHint(rows) ?? `${total.questions} câu · tổng tỷ lệ ${formatScore(total.percentage)}%`}
                onChange={(event) => setDraftTotalScore(Number(event.target.value))}
              />
            </div>
          </section>

          <section className="sep-section">
            <h2 className="sep-section-title">Phạm vi ma trận</h2>
            <ContextSelects
              contexts={contexts}
              value={selection}
              emptyLabel="Chọn…"
              error={errors.academicContextId}
              disabled={lockContext || delegated}
              disabledHint={
                delegated
                  ? 'Ngữ cảnh do nhiệm vụ được giao quy định'
                  : 'Xóa hết dòng chi tiết trước khi đổi ngữ cảnh'
              }
              onChange={setDraftSelection}
            />
          </section>
        </>
      )}

      <section className="sep-section">
        <div className="sep-section-head">
          <h2 className="sep-section-title">Nội dung và mức nhận thức</h2>
          {!reviewing && (
            <PcbButton
              variant="secondary"
              size="sm"
              aria-expanded={importOpen}
              disabled={academicContextId === null || lessonData.loading}
              onClick={() => {
                setImportOpen(!importOpen);
                setImportNotice(null);
              }}
            >
              <Icon name="upload_file" size={18} />
              Nhập từ Excel
            </PcbButton>
          )}
        </div>

        {importNotice && !reviewing && (
          <div className="sep-alert sep-alert--success" role="status">
            {importNotice}
          </div>
        )}

        {importOpen && !reviewing && academicContextId !== null && (
          <ExcelImportPanel
            context={{ academicContextId, name, totalScore }}
            hasRows={rows.length > 0}
            onApply={applyImport}
            onClose={() => setImportOpen(false)}
          />
        )}

        {!reviewing && !academicContextId && !importOpen && (
          <div className="sep-alert sep-alert--info">
            Chọn đủ Môn học và Khối lớp để hiện danh sách bài học.
          </div>
        )}

        <MatrixGrid
          rows={rows}
          lessons={lessons}
          matrixTotalScore={totalScore}
          readOnly={reviewing}
          errors={errors}
          onChange={setDraftRows}
        />
      </section>

      <div className="sep-actions">
        {reviewing ? (
          <>
            {matrixId ? (
              // Ma trận đang Đã nộp thì sửa xong vẫn phải đúng 10; ma trận Nháp thì lưu ở mọi tổng.
              <PcbButton
                disabled={saveBlocked || (submittedEdit && !totalOk)}
                title={submittedEdit && !totalOk ? `Cần đúng ${REQUIRED_TOTAL_PERCENTAGE}% mới lưu được` : undefined}
                onClick={() => void save(undefined, submittedEdit)}
              >
                Lưu thay đổi
              </PcbButton>
            ) : (
              <>
                <PcbButton variant="secondary" disabled={saveBlocked} onClick={() => void save()}>
                  Lưu nháp
                </PcbButton>
                {taskId ? (
                  <PcbButton
                    disabled={saveBlocked || !totalOk}
                    title={totalOk ? undefined : `Cần đúng ${REQUIRED_TOTAL_PERCENTAGE}% mới nộp được`}
                    onClick={() => void save((id) => api.matrix.submit(id), true)}
                  >
                    Nộp Phó Hiệu trưởng
                  </PcbButton>
                ) : (
                  // PHT tự tạo: backend cần tạo Nháp rồi xác nhận, người dùng chỉ thấy kết quả đã duyệt.
                  <PcbButton
                    disabled={saveBlocked || !totalOk}
                    title={totalOk ? undefined : `Cần đúng ${REQUIRED_TOTAL_PERCENTAGE}% mới tạo được`}
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
                back();
              }}
            >
              Huỷ
            </PcbButton>
            {/*
              Lưu ngay không cần qua bước xem lại. Với ma trận theo nhiệm vụ, lần lưu đầu là lúc nhiệm vụ
              "đã được thực hiện": từ đó PHT không xoá nhiệm vụ được nữa. Ma trận Đã nộp không lưu dở được.
            */}
            {!submittedEdit && (
              <PcbButton variant="secondary" disabled={saveBlocked} onClick={() => void save()}>
                Lưu nháp
              </PcbButton>
            )}
            <PcbButton
              disabled={busy}
              onClick={() => {
                if (validate(false)) setSearchParams({ step: 'review' });
              }}
            >
              Xem toàn bộ ma trận
              <Icon name="arrow_forward" size={20} />
            </PcbButton>
          </>
        )}
      </div>
      </div>
    </>
  );
};

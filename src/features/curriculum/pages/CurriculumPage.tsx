import { useMemo, useState, type ReactNode } from 'react';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { PageHeader } from '../../../components/common/PageHeader';
import { RowActionButton } from '../../../components/common/RowAction';
import { TableState } from '../../../components/common/TableState';
import { Field, Icon, PcbButton, SelectField } from '../../../components/pcb';
import { useAsync, useBusy } from '../../../hooks';
import { api } from '../../../services/api';
import type { ApiResponse, Chapter, CurriculumDeleteResult, Lesson } from '../../../types';
import { filterChapters, isFiltered, type CurriculumFilter } from '../../../utils/curriculumFilter';
import { saveBlob } from '../../../utils/download';
import { toProblem } from '../../../utils/problem';
import { ChapterFormDialog } from '../components/ChapterFormDialog';
import { ImportDialog } from '../components/ImportDialog';
import { LessonFormDialog } from '../components/LessonFormDialog';
import '../curriculum.css';

type Editing =
  | { kind: 'chapter'; chapter: Chapter | null }
  | { kind: 'lesson'; chapter: Chapter; lesson: Lesson | null }
  | { kind: 'import' }
  | null;

const EMPTY_FILTER: CurriculumFilter = { keyword: '' };

/** Hộp xác nhận xoá/lưu trữ đang mở. */
type Confirming = { kind: 'chương' | 'bài'; title: string; message: ReactNode; confirmText: string; run: () => Promise<ApiResponse<CurriculumDeleteResult>> };
/** Thông báo kết quả một nút (cùng kiểu hộp xác nhận). */
type Notice = { ok: boolean; message: string };

/**
 * Chương & bài học của phân hiệu. PHT xem và quản lý (thêm/sửa/xoá/nhập Excel); Tổ trưởng và Giáo viên chỉ xem.
 * Quyền quản lý lấy từ backend (`canManage`), không suy ra từ token.
 */
export const CurriculumPage = () => {
  const data = useAsync(() => api.curriculum.get(), []);
  const [filter, setFilter] = useState<CurriculumFilter>(EMPTY_FILTER);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [editing, setEditing] = useState<Editing>(null);
  const [confirming, setConfirming] = useState<Confirming | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [removing, runExclusive] = useBusy();

  const curriculum = data.data;
  const canManage = curriculum?.canManage ?? false;
  const chapters = useMemo(() => curriculum?.chapters ?? [], [curriculum]);
  const fields = useMemo(() => curriculum?.fields ?? [], [curriculum]);
  const visible = useMemo(() => filterChapters(chapters, filter), [chapters, filter]);
  const filtered = isFiltered(filter);
  const loadProblem = data.error != null ? toProblem(data.error) : null;

  const toggle = (id: number) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const saved = (message: string) => {
    setEditing(null);
    setNotice({ ok: true, message });
    data.reload();
  };

  const downloadTemplate = async () => {
    try {
      const { blob, filename } = await api.curriculum.downloadTemplate();
      saveBlob(blob, filename);
    } catch {
      setNotice({ ok: false, message: 'Không tải được file mẫu. Vui lòng thử lại.' });
    }
  };

  const remove = ({ run, kind }: Confirming) =>
    void runExclusive(async () => {
      try {
        const response = await run();
        setNotice({
          ok: true,
          message:
            response.message || (response.data?.archived ? `Đã lưu trữ ${kind} học.` : `Xoá ${kind} học thành công.`),
        });
      } catch (error) {
        setNotice({ ok: false, message: toProblem(error).message });
      }
      setConfirming(null);
      data.reload();
    });

  const deleteChapter = (chapter: Chapter) => {
    const label = (
      <>
        Chương {chapter.number}: "<strong>{chapter.title}</strong>"
      </>
    );
    setConfirming({
      kind: 'chương',
      title: chapter.inUse ? 'Lưu trữ chương?' : 'Xóa chương?',
      confirmText: chapter.inUse ? 'Lưu trữ chương' : 'Xóa chương',
      message: chapter.inUse ? (
        <>
          <p>{label} đang được dùng trong ma trận hoặc nhiệm vụ nên không thể xóa hẳn.</p>
          <p>Chương sẽ được ẩn khỏi danh sách và không dùng cho ma trận mới; ma trận, nhiệm vụ cũ vẫn giữ nguyên.</p>
        </>
      ) : (
        <>
          <p>
            {label} cùng {chapter.lessons.length} bài học sẽ bị xóa khỏi hệ thống.
          </p>
          <p>Hành động này sẽ không thể hoàn tác.</p>
        </>
      ),
      run: () => api.curriculum.deleteChapter(chapter.id),
    });
  };

  const deleteLesson = (lesson: Lesson) => {
    const label = (
      <>
        Bài {lesson.number}: "<strong>{lesson.title}</strong>"
      </>
    );
    setConfirming({
      kind: 'bài',
      title: lesson.inUse ? 'Lưu trữ bài học?' : 'Xóa bài học?',
      confirmText: lesson.inUse ? 'Lưu trữ bài học' : 'Xóa bài học',
      message: lesson.inUse ? (
        <>
          <p>{label} đang được dùng trong ma trận hoặc nhiệm vụ nên không thể xóa hẳn.</p>
          <p>Bài học sẽ được ẩn khỏi danh sách và không dùng cho ma trận mới; ma trận, nhiệm vụ cũ vẫn giữ nguyên.</p>
        </>
      ) : (
        <>
          <p>{label} sẽ bị xóa khỏi hệ thống.</p>
          <p>Hành động này sẽ không thể hoàn tác.</p>
        </>
      ),
      run: () => api.curriculum.deleteLesson(lesson.id),
    });
  };

  return (
    <>
      <PageHeader title="Chương & bài học" />

      <div className="sep-page">
        {!loadProblem && (
          <div className="sep-toolbar cur-toolbar">
            <div className="sep-toolbar__filters">
              <Field
                label="Tìm kiếm"
                hideLabel
                leading="search"
                placeholder="Tìm chương, bài học"
                title="Tìm chương hoặc bài học theo số (ví dụ: chương 2, bài 3) hoặc tên"
                value={filter.keyword}
                fieldClassName="sep-toolbar__search"
                onChange={(event) => setFilter({ ...filter, keyword: event.target.value })}
              />
              <SelectField
                label="Khối lớp"
                hideLabel
                placeholder="Khối lớp"
                value={filter.gradeLevelId ?? ''}
                onChange={(event) =>
                  setFilter({ ...filter, gradeLevelId: event.target.value ? Number(event.target.value) : undefined })
                }
              >
                <option value="">Tất cả khối lớp</option>
                {(curriculum?.grades ?? []).map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Môn học"
                hideLabel
                placeholder="Môn học"
                value={filter.fieldId ?? ''}
                onChange={(event) =>
                  setFilter({ ...filter, fieldId: event.target.value ? Number(event.target.value) : undefined })
                }
              >
                <option value="">Tất cả môn học</option>
                {fields.map((field) => (
                  <option key={field.id} value={field.id}>
                    {field.name}
                  </option>
                ))}
              </SelectField>
              {filtered && (
                <PcbButton variant="ghost" size="sm" onClick={() => setFilter(EMPTY_FILTER)}>
                  Xoá lọc
                </PcbButton>
              )}
            </div>
            {canManage && (
              <div className="sep-toolbar__actions">
                <PcbButton variant="secondary" onClick={() => setEditing({ kind: 'import' })}>
                  <Icon name="upload_file" size={20} />
                  Nhập từ Excel
                </PcbButton>
                <PcbButton onClick={() => setEditing({ kind: 'chapter', chapter: null })}>
                  Thêm chương
                  <Icon name="add" size={20} />
                </PcbButton>
              </div>
            )}
          </div>
        )}

        {loadProblem && (
          <div className="sep-alert cur-load-error" role="alert">
            <span>
              {loadProblem.status !== 403
                ? 'Không thể tải dữ liệu. Vui lòng thử lại.'
                : loadProblem.code
                  ? loadProblem.message // ví dụ tài khoản chưa được gán phân hiệu
                  : 'Bạn không có quyền truy cập trang này.'}
            </span>
            {loadProblem.status !== 403 && (
              <PcbButton variant="secondary" size="sm" onClick={data.reload}>
                Thử lại
              </PcbButton>
            )}
          </div>
        )}

        {!loadProblem && (
          <div>
            <div className="cur-list">
              {visible.map(({ chapter, lessons, matchedByLesson }) => {
                const open = expanded.has(chapter.id) || matchedByLesson;
                const panelId = `chapter-${chapter.id}-lessons`;
                const name = `Chương ${chapter.number}: ${chapter.title}`;
                return (
                  <section key={chapter.id} className={open ? 'cur-chapter cur-chapter--open' : 'cur-chapter'}>
                    <div className="cur-chapter__head">
                      <button
                        type="button"
                        className="pcb-iconbtn pcb-iconbtn--sm cur-chapter__chevron"
                        aria-expanded={open}
                        aria-controls={panelId}
                        aria-label={`${open ? 'Thu gọn' : 'Mở rộng'} ${name}`}
                        disabled={matchedByLesson}
                        onClick={() => toggle(chapter.id)}
                      >
                        <Icon name={open ? 'expand_more' : 'chevron_right'} size={20} />
                      </button>
                      <button type="button" className="cur-title-toggle" onClick={() => toggle(chapter.id)}>
                        {name}
                      </button>
                      <span className="cur-chapter__meta">
                        {chapter.gradeLevelName} · {chapter.fieldName} ·{' '}
                        {chapter.lessons.length} bài
                      </span>
                      {canManage && (
                        <span className="sep-row-actions cur-actions">
                          <RowActionButton
                            icon="edit"
                            label={`Sửa ${name}`}
                            onClick={() => setEditing({ kind: 'chapter', chapter })}
                          />
                          <RowActionButton icon="delete" label={`Xoá ${name}`} onClick={() => deleteChapter(chapter)} />
                        </span>
                      )}
                    </div>
                    {open && (
                      <div className="cur-chapter__body" id={panelId}>
                        {lessons.length === 0 ? (
                          <p className="cur-lessons-empty">Hiện chưa có bài học nào trong chương học này.</p>
                        ) : (
                          <ul className="cur-lessons" aria-label={`Bài học của ${name}`}>
                            {lessons.map((lesson) => {
                              const lessonName = `Bài ${lesson.number}: ${lesson.title}`;
                              return (
                                <li key={lesson.id} className="cur-lesson">
                                  <span className="cur-lesson__title">{lessonName}</span>
                                  {canManage && lesson.inUse && <span className="cur-lesson__tag">Đã dùng</span>}
                                  {canManage && (
                                    <span className="sep-row-actions cur-actions">
                                      <RowActionButton
                                        icon="edit"
                                        label={`Sửa ${lessonName}`}
                                        onClick={() => setEditing({ kind: 'lesson', chapter, lesson })}
                                      />
                                      <RowActionButton
                                        icon="delete"
                                        label={`Xoá ${lessonName}`}
                                        onClick={() => deleteLesson(lesson)}
                                      />
                                    </span>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                        {canManage && !matchedByLesson && (
                          <div className="cur-add-lesson">
                            <button
                              type="button"
                              className="cur-add-lesson__btn"
                              aria-label={`Thêm bài học vào chương ${chapter.number}`}
                              title={`Thêm bài học vào chương ${chapter.number}`}
                              onClick={() => setEditing({ kind: 'lesson', chapter, lesson: null })}
                            >
                              <Icon name="add" size={18} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>

            <TableState
              loading={data.loading}
              failed={false}
              empty={visible.length === 0}
              columns={3}
              title={
                chapters.length === 0
                  ? 'Hiện chưa có chương học nào trong hệ thống.'
                  : 'Không tìm thấy kết quả phù hợp với từ khóa tìm kiếm.'
              }
              hint={
                chapters.length === 0 && canManage
                  ? 'Thêm chương, hoặc nhập nhiều chương và bài cùng lúc từ tệp Excel theo mẫu.'
                  : undefined
              }
              action={
                chapters.length > 0 && filtered ? (
                  <PcbButton variant="secondary" size="sm" onClick={() => setFilter(EMPTY_FILTER)}>
                    Xoá lọc
                  </PcbButton>
                ) : undefined
              }
            />
          </div>
        )}
      </div>

      <ChapterFormDialog
        open={editing?.kind === 'chapter'}
        chapter={editing?.kind === 'chapter' ? editing.chapter : null}
        grades={curriculum?.grades ?? []}
        fields={fields}
        chapters={chapters}
        onClose={() => setEditing(null)}
        onSaved={saved}
      />
      <LessonFormDialog
        open={editing?.kind === 'lesson'}
        chapter={editing?.kind === 'lesson' ? editing.chapter : null}
        fieldName={editing?.kind === 'lesson' ? editing.chapter.fieldName : undefined}
        lesson={editing?.kind === 'lesson' ? editing.lesson : null}
        onClose={() => setEditing(null)}
        onSaved={(message) => {
          if (editing?.kind === 'lesson') setExpanded((current) => new Set(current).add(editing.chapter.id));
          saved(message);
        }}
      />
      <ImportDialog
        open={editing?.kind === 'import'}
        onClose={() => setEditing(null)}
        onDownloadTemplate={() => void downloadTemplate()}
        onImported={(result) =>
          saved(`Đã nhập ${result.newChapterCount} chương mới và ${result.lessonCount} bài học.`)
        }
      />
      <ConfirmDialog
        isOpen={confirming != null}
        className="sep-delete-confirm"
        type="danger"
        title={confirming?.title ?? ''}
        message={confirming?.message}
        confirmText={confirming?.confirmText}
        cancelText="Đóng"
        isLoading={removing}
        onCancel={() => setConfirming(null)}
        onConfirm={() => confirming && remove(confirming)}
      />
      <ConfirmDialog
        isOpen={notice != null}
        className="sep-delete-confirm"
        type={notice?.ok ? 'info' : 'danger'}
        title={notice?.ok ? 'Thành công' : 'Không thực hiện được'}
        message={<p>{notice?.message}</p>}
        confirmText="Đóng"
        hideCancel
        onCancel={() => setNotice(null)}
        onConfirm={() => setNotice(null)}
      />
    </>
  );
};

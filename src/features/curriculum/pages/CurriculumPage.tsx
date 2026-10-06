import { useMemo, useState } from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { RowActionButton } from '../../../components/common/RowAction';
import { TableState } from '../../../components/common/TableState';
import { Field, Icon, PcbButton, SelectField } from '../../../components/pcb';
import { useAsync, useNotice } from '../../../hooks';
import { api } from '../../../services/api';
import type { Chapter, Lesson } from '../../../types';
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

/**
 * Chương & bài học của phân hiệu. PHT xem và quản lý (thêm/sửa/xoá/nhập Excel); Tổ trưởng và Giáo viên chỉ xem.
 * Quyền quản lý lấy từ backend (`canManage`), không suy ra từ token.
 */
export const CurriculumPage = () => {
  const data = useAsync(() => api.curriculum.get(), []);
  const [filter, setFilter] = useState<CurriculumFilter>(EMPTY_FILTER);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [editing, setEditing] = useState<Editing>(null);
  const popup = useNotice();

  const curriculum = data.data;
  const canManage = curriculum?.canManage ?? false;
  const chapters = useMemo(() => curriculum?.chapters ?? [], [curriculum]);
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
    popup.success(message);
    data.reload();
  };

  const downloadTemplate = async () => {
    try {
      const { blob, filename } = await api.curriculum.downloadTemplate();
      saveBlob(blob, filename);
    } catch {
      popup.error('Không tải được file mẫu. Vui lòng thử lại.');
    }
  };

  const remove = async (run: () => Promise<unknown>, success: string) => {
    try {
      await run();
      popup.success(success);
    } catch (error) {
      popup.error(toProblem(error).message);
    }
    data.reload();
  };

  const deleteChapter = (chapter: Chapter) => {
    if (chapter.inUse) {
      popup.error('Chương học đã được sử dụng trong câu hỏi, đề thi, ma trận hoặc nhiệm vụ nên không thể xoá.');
      return;
    }
    popup.confirm(
      `Chương "${chapter.title}" chưa được sử dụng. Bạn có chắc muốn xoá chương này cùng toàn bộ ${chapter.lessons.length} bài học bên trong?`,
      () => void remove(() => api.curriculum.deleteChapter(chapter.id), 'Xoá chương học thành công.'),
      'Xoá',
    );
  };

  const deleteLesson = (lesson: Lesson) => {
    if (lesson.inUse) {
      popup.error('Bài học đã được sử dụng trong câu hỏi, đề thi, ma trận hoặc nhiệm vụ nên không thể xoá.');
      return;
    }
    popup.confirm(
      `Bài học "${lesson.title}" chưa được sử dụng. Bạn có chắc muốn xoá bài học này?`,
      () => void remove(() => api.curriculum.deleteLesson(lesson.id), 'Xoá bài học thành công.'),
      'Xoá',
    );
  };

  const columns = canManage ? 7 : 6;

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
                title="Tìm chương hoặc bài học theo mã hoặc tên"
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
                label="Lĩnh vực"
                hideLabel
                placeholder="Lĩnh vực"
                value={filter.fieldId ?? ''}
                onChange={(event) =>
                  setFilter({ ...filter, fieldId: event.target.value ? Number(event.target.value) : undefined })
                }
              >
                <option value="">Tất cả lĩnh vực</option>
                {(curriculum?.fields ?? []).map((field) => (
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
                <PcbButton variant="ghost" onClick={() => void downloadTemplate()}>
                  <Icon name="download" size={20} />
                  Tải file mẫu
                </PcbButton>
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
          <div className="pcb-table-wrap">
            <table className="pcb-table cur-table">
              <thead>
                <tr>
                  <th className="cur-col-toggle" aria-label="Mở rộng" />
                  <th className="cur-col-code">Mã chương</th>
                  <th>Tên chương</th>
                  <th>Khối lớp</th>
                  <th>Lĩnh vực</th>
                  <th className="cur-col-count">Số bài</th>
                  {canManage && <th className="sep-col-actions">Hành động</th>}
                </tr>
              </thead>
              <tbody>
                {visible.map(({ chapter, lessons, matchedByLesson }) => {
                  const open = expanded.has(chapter.id) || matchedByLesson;
                  const panelId = `chapter-${chapter.id}-lessons`;
                  return [
                    <tr key={chapter.id} className={open ? 'cur-chapter cur-chapter--open' : 'cur-chapter'}>
                      <td className="cur-col-toggle">
                        <button
                          type="button"
                          className="pcb-iconbtn pcb-iconbtn--sm"
                          aria-expanded={open}
                          aria-controls={panelId}
                          aria-label={`${open ? 'Thu gọn' : 'Mở rộng'} chương ${chapter.title}`}
                          disabled={matchedByLesson}
                          onClick={() => toggle(chapter.id)}
                        >
                          <Icon name={open ? 'expand_more' : 'chevron_right'} size={20} />
                        </button>
                      </td>
                      <td className="cur-col-code sep-nowrap">{chapter.code}</td>
                      <td>
                        <button type="button" className="cur-title-toggle" onClick={() => toggle(chapter.id)}>
                          {chapter.title}
                        </button>
                      </td>
                      <td className="sep-nowrap">{chapter.gradeLevelName}</td>
                      <td>{chapter.fieldName}</td>
                      <td className="cur-col-count">{chapter.lessons.length}</td>
                      {canManage && (
                        <td className="sep-col-actions">
                          <div className="sep-row-actions">
                            <RowActionButton
                              icon="edit"
                              label={`Sửa chương ${chapter.title}`}
                              onClick={() => setEditing({ kind: 'chapter', chapter })}
                            />
                            <RowActionButton
                              icon="delete"
                              label={`Xoá chương ${chapter.title}`}
                              onClick={() => deleteChapter(chapter)}
                            />
                          </div>
                        </td>
                      )}
                    </tr>,
                    open && (
                      <tr key={`${chapter.id}-lessons`} className="cur-lessons-row">
                        <td colSpan={columns} id={panelId}>
                          {lessons.length === 0 ? (
                            <p className="cur-lessons-empty">Hiện chưa có bài học nào trong chương học này.</p>
                          ) : (
                            <ul className="cur-lessons" aria-label={`Bài học của chương ${chapter.title}`}>
                              {lessons.map((lesson) => (
                                <li key={lesson.id} className="cur-lesson">
                                  <span className="cur-lesson__code">Bài {lesson.code}</span>
                                  <span className="cur-lesson__title">{lesson.title}</span>
                                  {canManage && lesson.inUse && <span className="cur-lesson__tag">Đã dùng</span>}
                                  {canManage && (
                                    <span className="sep-row-actions cur-lesson__actions">
                                      <RowActionButton
                                        icon="edit"
                                        label={`Sửa bài ${lesson.title}`}
                                        onClick={() => setEditing({ kind: 'lesson', chapter, lesson })}
                                      />
                                      <RowActionButton
                                        icon="delete"
                                        label={`Xoá bài ${lesson.title}`}
                                        onClick={() => deleteLesson(lesson)}
                                      />
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                          {canManage && !matchedByLesson && (
                            <PcbButton
                              variant="ghost"
                              size="sm"
                              className="cur-add-lesson"
                              onClick={() => setEditing({ kind: 'lesson', chapter, lesson: null })}
                            >
                              <Icon name="add" size={18} />
                              Thêm bài học
                            </PcbButton>
                          )}
                        </td>
                      </tr>
                    ),
                  ];
                })}
              </tbody>
            </table>

            <TableState
              loading={data.loading}
              failed={false}
              empty={visible.length === 0}
              columns={columns}
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
        fields={curriculum?.fields ?? []}
        onClose={() => setEditing(null)}
        onSaved={saved}
      />
      <LessonFormDialog
        open={editing?.kind === 'lesson'}
        chapter={editing?.kind === 'lesson' ? editing.chapter : null}
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
      {popup.dialog}
    </>
  );
};

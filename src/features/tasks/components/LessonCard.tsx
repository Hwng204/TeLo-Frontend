import type { ReactNode } from 'react';
import { PcbIconButton, SelectField } from '../../../components/pcb';
import { InfoGrid } from '../../../components/common/InfoGrid';
import type { Curriculum, TaskLesson } from '../../../types';
import { LEVELS, chapterLabel, draftTotal, lessonLabel, questionCount, type LessonDraft } from '../lessonDraft';

const LevelTable = ({ cells, total }: { cells: ReactNode[]; total: number }) => (
  // Dưới 480px tasks.css xoay bảng thành mỗi mức một dòng; khoảng giữa thì cuộn ngang trong thẻ.
  <div className="sep-level-scroll">
    <table className="sep-level-table">
      <thead>
        <tr>
          <th scope="col">Mức nhận thức</th>
          {LEVELS.map((level) => (
            <th key={level.key} scope="col">{level.label}</th>
          ))}
          <th scope="col">Tổng</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Số câu (trắc nghiệm)</th>
          {cells.map((cell, index) => (
            <td key={LEVELS[index].key}>{cell}</td>
          ))}
          <td className="sep-level-table__total">{total}</td>
        </tr>
      </tbody>
    </table>
  </div>
);

type EditorProps = {
  index: number;
  draft: LessonDraft;
  curriculum: Curriculum | undefined;
  disabled?: boolean;
  invalid?: boolean;
  onChange: (next: LessonDraft) => void;
  onRemove: () => void;
};

/** NV03-Q, NV04-Q: chọn Khối → Chương → Bài rồi nhập số câu từng mức. */
export const LessonCardEditor = ({ index, draft, curriculum, disabled, invalid, onChange, onRemove }: EditorProps) => {
  const chapters = curriculum?.chapters ?? [];
  // Chỉ khối đã có chương: chọn khối không có chương nào là ngõ cụt.
  const grades = (curriculum?.grades ?? []).filter((grade) => chapters.some((chapter) => chapter.gradeLevelId === grade.id));
  const gradeChapters = chapters.filter((chapter) => String(chapter.gradeLevelId) === draft.gradeLevelId);
  const lessons = gradeChapters.find((chapter) => String(chapter.id) === draft.chapterId)?.lessons ?? [];
  const title = `Bài học ${index + 1}`;

  return (
    <section className="sep-lesson-card" aria-label={title}>
      <div className="sep-lesson-card__head">
        <h3 className="sep-lesson-card__title">{title}</h3>
        {!disabled && <PcbIconButton icon="delete" label={`Xóa ${title.toLowerCase()}`} onClick={onRemove} />}
      </div>
      <div className="sep-task-row">
        <SelectField
          label="Khối lớp *"
          value={draft.gradeLevelId}
          disabled={disabled}
          invalid={invalid && !draft.gradeLevelId}
          onChange={(event) => onChange({ ...draft, gradeLevelId: event.target.value, chapterId: '', lessonId: '' })}
        >
          <option value="">Chọn khối lớp</option>
          {grades.map((grade) => (
            <option key={grade.id} value={grade.id}>
              {grade.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Chương *"
          value={draft.chapterId}
          disabled={disabled || !draft.gradeLevelId}
          invalid={invalid && !draft.chapterId}
          onChange={(event) => onChange({ ...draft, chapterId: event.target.value, lessonId: '' })}
        >
          <option value="">Chọn chương</option>
          {gradeChapters.map((chapter) => (
            <option key={chapter.id} value={chapter.id}>
              {chapterLabel(String(chapter.number), chapter.title)}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Bài học *"
          value={draft.lessonId}
          disabled={disabled || !draft.chapterId}
          invalid={invalid && !draft.lessonId}
          onChange={(event) => onChange({ ...draft, lessonId: event.target.value })}
        >
          <option value="">Chọn bài học</option>
          {lessons.map((lesson) => (
            <option key={lesson.id} value={lesson.id}>
              {lessonLabel(String(lesson.number), lesson.title)}
            </option>
          ))}
        </SelectField>
      </div>
      <LevelTable
        total={draftTotal(draft)}
        cells={LEVELS.map((level) => (
          <input
            className="sep-level-input"
            type="number"
            min={0}
            max={1000}
            step={1}
            inputMode="numeric"
            aria-label={`${level.label} – ${title.toLowerCase()}`}
            aria-invalid={questionCount(draft[level.key]) === null || (invalid && draftTotal(draft) === 0)}
            value={draft[level.key]}
            disabled={disabled}
            onChange={(event) => onChange({ ...draft, [level.key]: event.target.value })}
          />
        ))}
      />
    </section>
  );
};

/** T04-AD, T04-BD, NV02-QR: thẻ chỉ đọc, góc phải là tiến độ của bài. */
export const LessonCardView = ({ index, lesson, progress }: { index: number; lesson: TaskLesson; progress: string }) => (
  <section className="sep-lesson-card" aria-label={`Bài học ${index + 1}`}>
    <div className="sep-lesson-card__head">
      <h3 className="sep-lesson-card__title">Bài học {index + 1}</h3>
      <span className="sep-status">{progress}</span>
    </div>
    <InfoGrid
      className="sep-task-row"
      items={[
        { label: 'Khối lớp', value: lesson.gradeLevelName },
        { label: 'Chương', value: chapterLabel(lesson.chapterCode, lesson.chapterTitle) },
        { label: 'Bài học', value: lessonLabel(lesson.lessonCode, lesson.lessonTitle) },
      ]}
    />
    <LevelTable total={lesson.total} cells={[lesson.knowledge, lesson.understanding, lesson.application]} />
  </section>
);

import { useRef, useState } from 'react';
import { RequiredLabel, Icon, PcbButton } from '../../../components/pcb';
import { displayToast } from '../../../utils/toast';
import type { QuestionItem, SaveQuestion } from '../types';
import { keys } from '../types';
import { draftErrors, duplicateChoiceIndexes, fourChoices, missingDraftParts } from '../questionDraft';

type Props = { question: QuestionItem | null; initialDetailId: number; version: number; busy: boolean; onDirty: (dirty: boolean) => void; onSave: (request: SaveQuestion, next: boolean) => void; onRemove?: () => void };
export const QuestionEditor = ({ question, initialDetailId, version, busy, onDirty, onSave, onRemove }: Props) => {
  const [draft, setDraft] = useState<SaveQuestion>(() => ({ version, detailId: question?.detailId ?? initialDetailId, content: question?.content ?? '', options: fourChoices(question?.options), correctOption: question?.correctOption ?? null, explanation: question?.explanation ?? '' }));
  const original = useRef(draft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const duplicates = duplicateChoiceIndexes(draft.options);
  const missing = missingDraftParts(draft);
  const update = (patch: Partial<SaveQuestion>) => {
    const next = { ...draft, ...patch }; setDraft(next);
    onDirty(JSON.stringify(next) !== JSON.stringify(original.current));
  };
  const setChoice = (index: number, value: string) => update({
    options: draft.options.map((option, i) => i === index ? value : option),
    correctOption: !value.trim() && draft.correctOption === keys[index] ? null : draft.correctOption,
  });
  const save = (next: boolean) => {
    const found = draftErrors(draft); setErrors(found);
    if (Object.keys(found).length) { displayToast('error', 'Lỗi', Object.values(found), 5); return; }
    onSave({ ...draft, version, explanation: draft.explanation?.trim() || null }, next);
  };
  return <section className="question-editor" aria-label="Biên soạn câu hỏi">
    <div className="question-editor-heading"><h2 className="sep-section-title"><Icon name="edit_note" />{question ? 'Chỉnh sửa câu hỏi' : 'Biên soạn câu mới'}</h2><span className={`question-state ${missing.length ? 'question-state--draft' : 'question-state--complete'}`}><Icon name={missing.length ? 'pending' : 'check_circle'} size={16} />{missing.length ? 'Bản nháp' : 'Đủ nội dung'}</span></div>
    <div className="question-editor-scroll"><fieldset className="question-editor-fields" aria-label="Nội dung và đáp án" disabled={busy}>
      <div className="question-writing-fields">
      <div className="pcb-field"><label className="pcb-label" htmlFor="question-content"><RequiredLabel required>Nội dung câu hỏi</RequiredLabel></label>
        <textarea id="question-content" required className="sep-textarea" rows={4} maxLength={10000} value={draft.content} aria-invalid={!!errors.content} placeholder="Nhập nội dung rõ ràng, đầy đủ cho một câu hỏi…" onChange={e => update({ content: e.currentTarget.value })} />
        {errors.content && <span className="pcb-error" role="alert">{errors.content}</span>}
      </div>
      <div className="pcb-field"><label className="pcb-label" htmlFor="question-explanation">Giải thích đáp án <span className="sep-muted">(tùy chọn)</span></label>
        <textarea id="question-explanation" className="sep-textarea" rows={3} maxLength={6000} value={draft.explanation ?? ''} placeholder="Giải thích cách tìm đáp án đúng…" onChange={e => update({ explanation: e.currentTarget.value })} />
      </div>
      </div>
      <fieldset className="question-answer-fields"><legend className="pcb-label"><RequiredLabel required>Các lựa chọn</RequiredLabel></legend>
        {keys.map((key, index) => <div key={key} className={`question-answer-card${draft.correctOption === key ? ' question-answer-card--correct' : ''}`}>
          <div className="question-answer-card-heading"><label className="pcb-label" htmlFor={`question-choice-${key}`}>Lựa chọn {key}</label>
            <label className="question-correct-pick"><input type="radio" name="correct-answer" value={key} checked={draft.correctOption === key} disabled={!draft.options[index].trim()} onChange={() => update({ correctOption: key })} aria-label={`Đáp án đúng ${key}`} /><span>Đáp án đúng</span></label>
          </div>
          <textarea id={`question-choice-${key}`} className="sep-textarea" rows={2} maxLength={2000} value={draft.options[index]} aria-invalid={duplicates.has(index)} aria-describedby={duplicates.has(index) ? `choice-error-${key}` : undefined} placeholder={`Nhập lựa chọn ${key}`} onChange={e => setChoice(index, e.currentTarget.value)} />
          {duplicates.has(index) && <span id={`choice-error-${key}`} className="pcb-error" role="alert">Trùng nội dung với một lựa chọn khác.</span>}
        </div>)}
      </fieldset>
    </fieldset></div>
    <div className="question-editor-footer">
      <p className={'question-save-status' + (missing.length ? ' question-save-status--draft' : '')}><Icon name={missing.length ? 'info' : 'check_circle'} size={16} />{missing.length ? 'Có thể lưu nháp; còn thiếu ' + missing.join(', ') + '.' : 'Đủ nội dung và đáp án. Chọn Lưu câu hỏi để lưu thay đổi.'}</p>
      <div className="sep-actions question-editor-actions">
        {onRemove && <PcbButton variant="danger" size="sm" className="question-delete-button" disabled={busy} onClick={onRemove}><Icon name="delete" size={18} />Xóa câu này</PcbButton>}
        <PcbButton variant="secondary" disabled={busy} onClick={() => save(true)}><Icon name="add_circle" />Lưu và thêm câu tiếp</PcbButton>
        <PcbButton disabled={busy} onClick={() => save(false)}><Icon name="save" />{busy ? 'Đang lưu…' : 'Lưu câu hỏi'}</PcbButton>
      </div>
    </div>
  </section>;
};

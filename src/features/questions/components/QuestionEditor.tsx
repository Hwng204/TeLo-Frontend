import { useState } from 'react';
import { RequiredLabel, Field, Icon, PcbButton, SelectField } from '../../../components/pcb';
import type { QuestionItem, QuestionTarget, SaveQuestion } from '../types';
import { keys, levels } from '../types';

type Props = { question: QuestionItem | null; targets: QuestionTarget[]; initialDetailId: number; version: number; busy: boolean; onDirty: () => void; onSave: (request: SaveQuestion, next: boolean) => void };
export const QuestionEditor = ({ question, targets, initialDetailId, version, busy, onDirty, onSave }: Props) => {
  const [detailId, setDetailId] = useState(question?.detailId ?? initialDetailId);
  const [content, setContent] = useState(question?.content ?? '');
  const [options, setOptions] = useState(question?.options ?? ['', '', '', '']);
  const [correctOption, setCorrectOption] = useState<string | null>(question?.correctOption ?? null);
  const [explanation, setExplanation] = useState(question?.explanation ?? '');
  const changed = () => onDirty();
  const save = (next: boolean) => onSave({ version, detailId, content, options, correctOption, explanation: explanation.trim() || null }, next);
  return <section className="question-editor" aria-label="Biên soạn câu hỏi">
    <h2 className="sep-section-title">{question ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi'}</h2>
    <SelectField label="Bài học · Mức nhận thức *" value={detailId} onChange={e => { setDetailId(Number(e.target.value)); changed(); }}>
      {targets.map(t => <option key={t.detailId} value={t.detailId}>{t.gradeName} · {t.chapterCode && t.lessonCode ? `${t.chapterCode}/${t.lessonCode}` : t.chapterTitle} · {t.lessonTitle} · {levels[t.cognitiveLevel]} ({t.validCount}/{t.requiredCount})</option>)}
    </SelectField>
    <label className="pcb-label" htmlFor="question-content"><RequiredLabel required>Nội dung câu hỏi</RequiredLabel></label>
    <textarea id="question-content" aria-required="true" className="sep-textarea" rows={4} maxLength={10000} value={content} onChange={e => { setContent(e.target.value); changed(); }} />
    <fieldset className="question-answer-fields"><legend className="pcb-label"><RequiredLabel required>Lựa chọn và đáp án đúng</RequiredLabel></legend>
      <p className="sep-muted question-answer-help">Điền ít nhất 2 lựa chọn trong A–D. Ô không dùng để trống. Chọn một lựa chọn đã điền làm đáp án đúng.</p>
      {keys.map((key, index) => <div key={key} className="question-answer-row">
        <label className="question-correct-pick" title={`Chọn ${key} là đáp án đúng`}>
          <input type="radio" name="correct-answer" value={key} checked={correctOption === key} disabled={busy || !options[index].trim()} onChange={() => { setCorrectOption(key); changed(); }} aria-label={`Đáp án đúng ${key}`} />
          <span>{key}</span>
        </label>
        <Field label={`Lựa chọn ${key}`} hideLabel value={options[index]} maxLength={2000} placeholder={`Lựa chọn ${key} · để trống nếu không dùng`} onChange={e => { setOptions(options.map((v, i) => i === index ? e.target.value : v)); if (!e.target.value.trim() && correctOption === key) setCorrectOption(null); changed(); }} />
      </div>)}
    </fieldset>
    <label className="pcb-label" htmlFor="question-explanation">Giải thích</label>
    <textarea id="question-explanation" className="sep-textarea" rows={2} maxLength={6000} value={explanation} onChange={e => { setExplanation(e.target.value); changed(); }} />
    <div className="sep-actions">
      <PcbButton variant="secondary" disabled={busy} onClick={() => save(false)}><Icon name="save" />Lưu</PcbButton>
      <PcbButton disabled={busy} onClick={() => save(true)}><Icon name="add" />Lưu và thêm câu tiếp</PcbButton>
    </div>
    <p className="sep-muted question-answer-help">Có thể lưu câu chưa hoàn chỉnh để làm tiếp. Câu hoàn chỉnh mới được tính khi gửi gói.</p>
  </section>;
};

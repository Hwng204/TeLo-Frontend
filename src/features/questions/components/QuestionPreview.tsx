import type { QuestionItem } from '../types';
import { keys } from '../types';

export const QuestionPreview = ({ question }: { question: QuestionItem }) => (
  <div className="question-preview">
    <p className="question-content">{question.content || 'Chưa nhập nội dung'}</p>
    <ol className="question-options">
      {keys.map((key, index) => question.options[index]?.trim() ? <li key={key} className={question.correctOption === key ? 'question-option--correct' : ''}>
        <strong>{key}</strong><span>{question.options[index]}</span>{question.correctOption === key && <span className="question-answer-label">✓ Đáp án đúng</span>}
      </li> : null)}
    </ol>
    {!question.options.some(option => option.trim()) && <p className="sep-muted">Chưa có lựa chọn.</p>}
    {question.explanation && <div className="question-explanation"><strong>Giải thích</strong><p>{question.explanation}</p></div>}
  </div>
);

import type { QuestionItem } from '../types';
import { keys } from '../types';

export const QuestionPreview = ({ question }: { question: QuestionItem }) => (
  <div className="question-preview">
    <p className="question-content">{question.content || 'Chưa nhập nội dung'}</p>
    <ol className="question-options">
      {keys.map((key, index) => <li key={key} className={question.correctOption === key && question.options[index]?.trim() ? 'question-option--correct' : ''}>
        <strong>{key}.</strong><span title={!question.options[index]?.trim() ? 'Lựa chọn không dùng' : undefined}>{question.options[index]?.trim() ? question.options[index] : '—'}</span>{question.correctOption === key && question.options[index]?.trim() && <span className="question-answer-label">Đáp án đúng</span>}
      </li>)}
    </ol>
    {question.explanation && <div className="question-explanation"><strong>Giải thích</strong><p>{question.explanation}</p></div>}
  </div>
);

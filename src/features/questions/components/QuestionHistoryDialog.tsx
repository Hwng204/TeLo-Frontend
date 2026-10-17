import { useState } from 'react';
import { FormDialog } from '../../../components/common/FormDialog';
import { formatDate } from '../../../utils/formatters';
import type { QuestionSubmission } from '../types';
import { statuses } from '../types';
import { QuestionNavigator } from './QuestionNavigator';
import { QuestionPreview } from './QuestionPreview';

export const QuestionHistoryDialog = ({ submission, onClose }: { submission: QuestionSubmission; onClose: () => void }) => {
  const [selected, setSelected] = useState(submission.questions[0]?.id ?? null);
  const current = submission.questions.find(q => q.id === selected);
  return <FormDialog open title={`Lần nộp ${submission.number}`} onClose={onClose} className="question-history-dialog">
    <p className="sep-muted">{formatDate(submission.submittedAt)} · {statuses[submission.status]} · {submission.questions.length} câu</p>
    {submission.comment && <div className="question-review-note"><strong>Nhận xét gói</strong><p>{submission.comment}</p></div>}
    <div className="question-workspace">
      <QuestionNavigator items={submission.questions.map((q, index) => ({ id: q.id, number: index + 1, content: q.content, complete: q.isComplete }))} selectedId={selected} onSelect={setSelected} />
      <section key={current?.id ?? 'empty'} className="question-reader" aria-label="Câu hỏi trong bản nộp">{current ? <><h3>Câu {submission.questions.indexOf(current) + 1}</h3><QuestionPreview question={current} />{submission.notes.filter(n => n.questionId === current.id).map(note => <div className="question-review-note" key={note.questionId}>{note.comment}</div>)}</> : <p>Không có câu hỏi trong bản nộp.</p>}</section>
    </div>
  </FormDialog>;
};

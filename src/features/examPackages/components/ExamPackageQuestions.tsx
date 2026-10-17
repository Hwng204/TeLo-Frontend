import { useState } from 'react';
import { Icon, PcbButton, SelectField } from '../../../components/pcb';
import { QuestionNavigator } from '../../questions/components/QuestionNavigator';
import { QuestionPreview } from '../../questions/components/QuestionPreview';
import { levels } from '../../questions/types';
import type { PackageDetail, PackageQuestion } from '../types';

export const ExamPackageQuestions = ({ data, busy, onReplace }: { data: PackageDetail; busy: boolean; onReplace: (row: PackageQuestion) => void }) => {
  const [filter, setFilter] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const rows = data.questions.filter(row => !filter || row.detailId === filter);
  const current = rows.find(row => row.id === selected) ?? rows[0];
  const position = rows.findIndex(row => row.id === current?.id);
  const cell = data.cells.find(item => item.id === current?.detailId);
  return <section className="exam-package-content" aria-label="Nội dung đề thi">
    <div className="question-toolbar"><h2 className="sep-section-title"><Icon name="quiz" />Nội dung đề <span className="question-total-count">{data.questions.length} câu</span></h2><SelectField label="Lọc phần trong ma trận" hideLabel value={filter} disabled={busy} onChange={event => { setFilter(Number(event.target.value)); setSelected(null); }}>
      <option value={0}>Tất cả phần trong ma trận</option>{data.cells.map(item => <option key={item.id} value={item.id}>{item.lessonTitle} · {levels[item.cognitiveLevel]} ({item.requiredCount} câu)</option>)}
    </SelectField></div>
    <div className="question-workspace">
      <QuestionNavigator items={rows.map(row => { const item = data.cells.find(cell => cell.id === row.detailId); return { id: row.id, number: data.questions.indexOf(row) + 1, content: row.question.content, meta: item ? item.lessonTitle + ' · ' + levels[item.cognitiveLevel] : undefined }; })} selectedId={current?.id ?? null} busy={busy} onSelect={setSelected} />
      <div className="question-content-panel">
        <div className="question-current-heading"><div className="question-current-identity"><span className="question-current-number">{current ? data.questions.indexOf(current) + 1 : '—'}</span><div><strong>{current ? 'Câu ' + (data.questions.indexOf(current) + 1) + ' / ' + data.questions.length : 'Chưa có câu hỏi'}</strong>{cell && <p title={cell.lessonTitle}>{cell.lessonTitle}</p>}</div>{cell && <span className={'question-level question-level--' + cell.cognitiveLevel}>{levels[cell.cognitiveLevel]}</span>}</div>
          <div className="question-toolbar-actions"><PcbButton variant="secondary" size="sm" disabled={busy || position <= 0} onClick={() => setSelected(rows[position - 1].id)}><Icon name="chevron_left" />Trước</PcbButton><PcbButton variant="secondary" size="sm" disabled={busy || position < 0 || position >= rows.length - 1} onClick={() => setSelected(rows[position + 1].id)}>Sau<Icon name="chevron_right" /></PcbButton></div>
        </div>
        <div key={current?.question.id ?? 'empty'} className="question-reader">{current ? <QuestionPreview question={current.question} /> : <p className="question-empty-message"><Icon name="quiz" size={36} />Không có câu trong phần đang chọn.</p>}</div>
        {current && <div className="question-panel-footer">{cell && <p className="exam-cell-context"><strong>Ô ma trận</strong><span>{rows.filter(row => row.detailId === cell.id).length}/{cell.requiredCount} câu · {cell.percentage}% · {cell.score} điểm</span></p>}{data.canReplace ? <PcbButton disabled={busy} onClick={() => onReplace(current)}><Icon name="swap_horiz" />Thay câu từ ngân hàng</PcbButton> : <span className="question-readonly-label"><Icon name="lock" size={16} />Chỉ xem</span>}</div>}
      </div>
    </div>
  </section>;
};

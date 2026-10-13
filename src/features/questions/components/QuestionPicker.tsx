import { useState } from 'react';
import { FormDialog } from '../../../components/common/FormDialog';
import { Pager } from '../../../components/common/Pager';
import { Field, PcbButton } from '../../../components/pcb';
import { useAsync, useDebounce } from '../../../hooks';
import { toProblem } from '../../../utils/problem';
import { questionApi } from '../questionApi';
import type { QuestionItem } from '../types';
import { QuestionPreview } from './QuestionPreview';

export const QuestionPicker = ({ matrixId, detailId, onClose, onSelect, selectedIds = [] }: { matrixId: number; detailId: number; onClose: () => void; onSelect?: (questions: QuestionItem[]) => void; selectedIds?: number[] }) => {
  const [search, setSearch] = useState(''); const keyword = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [chosen, setChosen] = useState<QuestionItem[]>([]);
  const list = useAsync(() => questionApi.bank({ matrixId, matrixDetailId: detailId, bankType: 'exam', keyword, page, pageSize: 10 }), [matrixId, detailId, keyword, page]);
  return <FormDialog open title={onSelect ? 'Chọn câu hỏi từ ngân hàng' : 'Câu hỏi phù hợp'} onClose={onClose}>
    <Field label="Tìm câu hỏi" hideLabel type="search" placeholder="Tìm nội dung câu hỏi" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
    {list.loading && <p role="status">Đang tải…</p>}{Boolean(list.error) && <p className="sep-alert" role="alert">{toProblem(list.error).message}<PcbButton variant="ghost" onClick={list.reload}>Thử lại</PcbButton></p>}
    {list.data?.items.length === 0 && <p className="sep-muted">Chưa có câu hỏi phù hợp.</p>}
    {list.data?.items.map(({ question }) => <details key={question.id} className="question-picker-row"><summary>
      {onSelect && <input type="checkbox" aria-label={`Chọn câu ${question.content}`} disabled={selectedIds.includes(question.id)} checked={selectedIds.includes(question.id) || chosen.some(q => q.id === question.id)} onClick={e => e.stopPropagation()} onChange={e => setChosen(e.target.checked ? [...chosen, question] : chosen.filter(q => q.id !== question.id))} />}
      {' '}{question.content}</summary><QuestionPreview question={question} /></details>)}
    <Pager page={page} pageSize={10} totalCount={list.data?.totalCount ?? 0} itemLabel="câu hỏi" onChange={setPage} onPageSizeChange={() => {}} pageSizes={[10]} />
    <div className="sep-actions"><PcbButton variant="ghost" onClick={onClose}>Đóng</PcbButton>{onSelect && <PcbButton disabled={chosen.length === 0} onClick={() => onSelect(chosen)}>Thêm {chosen.length} câu đã chọn</PcbButton>}</div>
  </FormDialog>;
};

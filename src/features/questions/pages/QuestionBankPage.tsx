import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Field, Icon, PcbButton, SelectField } from '../../../components/pcb';
import { PageHeader } from '../../../components/common/PageHeader';
import { Pager } from '../../../components/common/Pager';
import { FormDialog } from '../../../components/common/FormDialog';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { NoticeDialog, type Notice } from '../../../components/common/NoticeDialog';
import { useAsync, useBusy, useDebounce } from '../../../hooks';
import { toProblem } from '../../../utils/problem';
import { formatDate } from '../../../utils/formatters';
import { questionApi } from '../questionApi';
import { levels, type BankQuestion, type BankQuery } from '../types';
import { QuestionPreview } from '../components/QuestionPreview';
import '../questions.css';

export const QuestionBankPage = () => {
  const [params, setParams] = useSearchParams();
  const bankType = params.get('bankType') === 'practice' ? 'practice' : 'exam';
  const [filters, setFilters] = useState<BankQuery>({});
  const [keyword, setKeyword] = useState('');
  const debounced = useDebounce(keyword, 300);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<BankQuestion | null>(null);
  const [pending, setPending] = useState<BankQuestion | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, runExclusive] = useBusy();
  const options = useAsync(() => questionApi.options(), []);
  const query = { ...filters, page, pageSize, bankType, keyword: debounced.trim() || undefined };
  const list = useAsync(() => questionApi.bank(query), [query]);
  const change = (patch: BankQuery) => { setFilters({ ...filters, ...patch }); setPage(1); };
  const askMove = (row: BankQuestion) => { setSelected(null); setPending(row); };
  const move = () => {
    if (!pending) return;
    void runExclusive(async () => { try { await questionApi.move(pending.question.id); setPending(null); list.reload(); setNotice({ kind: 'success', messages: ['Đã chuyển câu hỏi sang ngân hàng ôn tập.'] }); } catch (error) { setPending(null); setNotice({ kind: 'error', messages: [toProblem(error).message] }); } });
  };
  return <><PageHeader title="Ngân hàng câu hỏi" /><div className="sep-page">
    <div className="question-bank-tabs" role="tablist" aria-label="Loại ngân hàng">
      {[['exam', 'Câu hỏi thi'], ['practice', 'Câu hỏi ôn tập']].map(([value, label]) => <button key={value} role="tab" aria-selected={bankType === value} onClick={() => { setParams({ bankType: value }); setPage(1); }}>{label}</button>)}
    </div>
    <div className="sep-toolbar question-toolbar">
      <Field label="Tìm câu hỏi" hideLabel type="search" value={keyword} placeholder="Tìm nội dung câu hỏi" onChange={e => { setKeyword(e.target.value); setPage(1); }} />
      <SelectField label="Môn học" hideLabel value={filters.subjectId ?? ''} onChange={e => change({ subjectId: Number(e.target.value) || undefined, chapterId: undefined, lessonId: undefined })}><option value="">Tất cả môn học</option>{options.data?.subjects.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</SelectField>
      <SelectField label="Khối lớp" hideLabel value={filters.gradeLevelId ?? ''} onChange={e => change({ gradeLevelId: Number(e.target.value) || undefined, chapterId: undefined, lessonId: undefined })}><option value="">Tất cả khối lớp</option>{options.data?.grades.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</SelectField>
      <SelectField label="Chương" hideLabel value={filters.chapterId ?? ''} onChange={e => change({ chapterId: Number(e.target.value) || undefined, lessonId: undefined })}><option value="">Tất cả chương</option>{options.data?.chapters.filter(x => !filters.gradeLevelId || x.parentId === filters.gradeLevelId).map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</SelectField>
      <SelectField label="Bài học" hideLabel value={filters.lessonId ?? ''} onChange={e => change({ lessonId: Number(e.target.value) || undefined })}><option value="">Tất cả bài học</option>{options.data?.lessons.filter(x => !filters.chapterId || x.parentId === filters.chapterId).map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</SelectField>
      <SelectField label="Mức nhận thức" hideLabel value={filters.cognitiveLevel ?? ''} onChange={e => change({ cognitiveLevel: e.target.value || undefined })}><option value="">Tất cả mức nhận thức</option>{Object.entries(levels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</SelectField>
    </div>
    {Boolean(options.error || list.error) && <div className="sep-alert" role="alert">{toProblem(options.error || list.error).message}<PcbButton variant="ghost" onClick={() => { list.reload(); options.reload(); }}>Thử lại</PcbButton></div>}
    <div className="sep-table-scroll"><table className="pcb-table sep-table--dense"><thead><tr><th>STT</th><th>Câu hỏi</th><th>Môn · Khối</th><th>Bài học</th><th>Mức nhận thức</th><th>Người soạn</th><th>Hành động</th></tr></thead><tbody>
      {list.loading && <tr><td colSpan={7} role="status">Đang tải…</td></tr>}
      {!list.loading && !list.error && list.data?.items.length === 0 && <tr><td colSpan={7} className="sep-empty">Chưa có câu hỏi phù hợp.</td></tr>}
      {list.data?.items.map((row, i) => <tr key={row.question.id}><td>{(page - 1) * pageSize + i + 1}</td><td className="question-bank-content">{row.question.content}</td><td>{row.subjectName} · {row.gradeName}</td><td>{row.lessonTitle}</td><td>{levels[row.cognitiveLevel]}</td><td>{row.authorName}</td><td className="sep-col-actions"><button className="pcb-iconbtn" aria-label={`Xem câu hỏi ${i + 1}`} title="Xem câu hỏi" onClick={() => setSelected(row)}><Icon name="visibility" /></button>{row.canMoveToPractice && <button className="pcb-iconbtn" aria-label={`Chuyển câu hỏi ${i + 1} sang ôn tập`} title="Chuyển sang ôn tập" onClick={() => askMove(row)}><Icon name="drive_file_move" /></button>}</td></tr>)}
    </tbody></table></div>
    <Pager page={page} pageSize={pageSize} totalCount={list.data?.totalCount ?? 0} itemLabel="câu hỏi" onChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1); }} />
  </div>
  <FormDialog open={selected !== null} title="Chi tiết câu hỏi" onClose={() => setSelected(null)}>{selected && <><p className="sep-muted">{selected.subjectName} · {selected.gradeName} · {selected.lessonTitle} · {levels[selected.cognitiveLevel]}</p><QuestionPreview question={selected.question} /><p className="sep-muted">{selected.authorName}{selected.approvedAt && ` · Chốt ${formatDate(selected.approvedAt)}`}</p>{selected.practiceAt && <p className="sep-muted">{selected.practiceReason} · {formatDate(selected.practiceAt)}</p>}<div className="sep-actions"><PcbButton variant="ghost" onClick={() => setSelected(null)}>Đóng</PcbButton>{selected.canMoveToPractice && <PcbButton onClick={() => askMove(selected)}><Icon name="drive_file_move" />Chuyển sang ôn tập</PcbButton>}</div></>}</FormDialog>
  <ConfirmDialog isOpen={pending !== null} title="Chuyển sang ôn tập" message="Chuyển câu hỏi này sang ngân hàng ôn tập?" confirmText="Chuyển sang ôn tập" type="info" isLoading={busy} onCancel={() => setPending(null)} onConfirm={move} />
  <NoticeDialog notice={notice} onClose={() => setNotice(null)} />
  </>;
};

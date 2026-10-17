import { useEffect, useRef, useState } from 'react';
import { Field, Icon, PcbButton } from '../../../components/pcb';

export type QuestionNavItem = { id: number; number: number; content: string; meta?: string; complete?: boolean };
export const QuestionNavigator = ({ items, selectedId, busy = false, onSelect }: { items: QuestionNavItem[]; selectedId: number | null; busy?: boolean; onSelect: (id: number) => void }) => {
  const [search, setSearch] = useState('');
  const [chosenPage, setChosenPage] = useState({ key: '', page: 1 });
  const listRef = useRef<HTMLDivElement>(null);
  const keyword = search.trim().toLocaleLowerCase('vi');
  const filtered = items.filter(item => !keyword || `${item.number} ${item.content} ${item.meta ?? ''}`.toLocaleLowerCase('vi').includes(keyword));
  const size = 12; const pages = Math.max(1, Math.ceil(filtered.length / size));
  const key = `${selectedId}|${keyword}|${filtered.map(item => item.id).join(',')}`;
  const activeIndex = filtered.findIndex(item => item.id === selectedId);
  const page = chosenPage.key === key ? Math.min(pages, chosenPage.page) : Math.max(1, Math.floor(activeIndex / size) + 1);
  const visible = filtered.slice((page - 1) * size, page * size);
  useEffect(() => {
    const list = listRef.current;
    const active = list?.querySelector<HTMLButtonElement>('[aria-current="true"]');
    if (!list) return;
    if (!active) { list.scrollTop = 0; return; }
    // Scroll only the question list, keeping the workspace and action buttons in place.
    const top = active.offsetTop; const bottom = top + active.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  }, [selectedId, page, keyword]);
  return <aside className="question-navigator" aria-label="Danh sách câu hỏi">
    <div className="question-navigator-heading"><h2><Icon name="format_list_numbered" />Danh sách câu</h2><span>{items.length} câu</span></div>
    <Field label="Tìm câu trong danh sách" hideLabel type="search" leading="search" placeholder="Tìm nội dung hoặc số câu…" value={search} disabled={busy} onChange={e => setSearch(e.target.value)} />
    <div ref={listRef} className="question-navigator-list">
      {visible.map(item => <button type="button" key={item.id} className={`question-nav-row${selectedId === item.id ? ' question-nav-row--active' : ''}`} aria-label={`Mở câu ${item.number}: ${item.content || 'Chưa nhập nội dung'}`} aria-current={selectedId === item.id ? 'true' : undefined} disabled={busy} onClick={() => onSelect(item.id)}>
        <span className="question-nav-number">{item.number}</span><span className="question-nav-copy"><span className="question-list-content">{item.content || 'Chưa nhập nội dung'}</span><small title={item.meta}>{item.meta || 'Câu hỏi trong đề'}</small><span className={'question-nav-state' + (item.complete === false ? ' question-nav-state--draft' : '')}><Icon name={item.complete === false ? 'edit_note' : selectedId === item.id ? 'visibility' : 'check_circle'} size={14} />{item.complete === false ? 'Bản nháp' : selectedId === item.id ? 'Đang xem' : item.complete === true ? 'Hoàn chỉnh' : 'Xem câu hỏi'}</span></span>
      </button>)}
      {visible.length === 0 && <p className="question-navigator-empty">{search ? 'Không có câu khớp tìm kiếm.' : 'Chưa có câu ở phần đang chọn.'}</p>}
    </div>
    <div className="question-navigator-footer"><span>Trang <strong>{page}/{pages}</strong> · {filtered.length} câu</span><div><PcbButton size="sm" variant="secondary" aria-label="Trang câu hỏi trước" disabled={busy || page <= 1} onClick={() => setChosenPage({ key, page: page - 1 })}><Icon name="chevron_left" /></PcbButton><PcbButton size="sm" variant="secondary" aria-label="Trang câu hỏi sau" disabled={busy || page >= pages} onClick={() => setChosenPage({ key, page: page + 1 })}><Icon name="chevron_right" /></PcbButton></div></div>
  </aside>;
};

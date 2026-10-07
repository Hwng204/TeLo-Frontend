import { useState } from 'react';
import { PcbButton, SelectField } from '../../../components/pcb';
import { useAsync, useBusy, useDebounce, useNotice } from '../../../hooks';
import { api } from '../../../services/api';
import type { EmailEventItem, EmailSchoolItem } from '../../../types';
import { problemLines, toProblem } from '../../../utils/problem';
import { EmailEventEditor } from '../components/EmailEventEditor';
import { EmailPager, EmailSearch, EmailState, EmailStatus } from '../components/EmailUi';

export function EmailEvents({ school, onChanged, onOpen }: { school: EmailSchoolItem; onChanged: () => void; onOpen: (tab: 'templates' | 'configuration', eventCode: string) => void }) {
  const [search, setSearch] = useState(''); const [status, setStatus] = useState('');
  const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(20);
  const [editor, setEditor] = useState<EmailEventItem | 'new' | null>(null);
  const keyword = useDebounce(search, 300);
  const list = useAsync(() => api.email.events(school.id, { search: keyword, status, page, pageSize }), [school.id, keyword, status, page, pageSize]);
  const [busy, run] = useBusy(); const notice = useNotice();
  const change = (item: EmailEventItem, remove = false) => notice.confirm(remove ? `Xóa sự kiện ${item.name}?` : `${item.status === 'ACTIVE' ? 'Ngừng' : 'Bật'} áp dụng ${item.name}?`, () => {
    void run(async () => {
      try { if (remove) await api.email.deleteEvent(school.id, item.code, item.version!); else await api.email.eventStatus(school.id, item.code, item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE', item.version!);
        list.reload(); onChanged(); }
      catch (error) { notice.error(problemLines(toProblem(error))); }
    });
  }, remove ? 'Xóa' : 'Xác nhận');
  return <>
    <div className="email-toolbar"><EmailSearch value={search} onChange={v => { setSearch(v); setPage(1); }} />
      <SelectField label="Trạng thái" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">Tất cả</option><option value="ACTIVE">Đang áp dụng</option><option value="INACTIVE">Ngừng áp dụng</option></SelectField>
      {school.canManageTemplates && <PcbButton onClick={() => setEditor('new')}>Thêm sự kiện</PcbButton>}</div>
    <section className="email-panel" aria-label="Danh mục sự kiện"><EmailState {...list} count={list.data?.items.length ?? 0} />
      {!!list.data?.items.length && <div className="pcb-table-wrap"><table className="pcb-table"><thead><tr><th>Sự kiện</th><th>Cách kích hoạt</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
        <tbody>{list.data.items.map(item => <tr key={item.code}><td><strong>{item.name}</strong><div className="sep-subline">{item.code}</div>{item.description && <div className="sep-subline">{item.description}</div>}</td>
          <td>{item.triggerKind === 'SYSTEM' ? 'Tự động từ nghiệp vụ' : 'Thủ công / đặt lịch'}</td><td><EmailStatus status={item.status ?? ''} /></td>
          <td><div className="email-actions"><PcbButton variant="secondary" size="sm" onClick={() => onOpen('templates', item.code)}>Mẫu email</PcbButton><PcbButton variant="secondary" size="sm" onClick={() => onOpen('configuration', item.code)}>Cấu hình</PcbButton></div>{school.canManageTemplates && item.triggerKind === 'MANUAL' && <div className="email-actions"><PcbButton variant="secondary" size="sm" disabled={busy} onClick={() => setEditor(item)}>Sửa</PcbButton>
            <PcbButton variant="secondary" size="sm" disabled={busy} onClick={() => change(item)}>{item.status === 'ACTIVE' ? 'Ngừng áp dụng' : 'Bật áp dụng'}</PcbButton>
            {item.canDelete && <PcbButton variant="danger" size="sm" disabled={busy} onClick={() => change(item, true)}>Xóa</PcbButton>}</div>}</td></tr>)}</tbody></table></div>}
      <EmailPager data={list.data} page={page} pageSize={pageSize} setPage={setPage} setPageSize={setPageSize} label="sự kiện" />
    </section>
    {editor && <EmailEventEditor schoolId={school.id} item={editor === 'new' ? undefined : editor} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); list.reload(); onChanged(); notice.success('Đã lưu sự kiện.'); }} />}{notice.dialog}
  </>;
}

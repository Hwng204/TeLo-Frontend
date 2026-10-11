import { useState } from 'react';
import { PcbButton, SelectField } from '../../../components/pcb';
import { useAsync, useBusy, useDebounce, useNotice } from '../../../hooks';
import { api } from '../../../services/api';
import type { EmailEventItem, EmailSchoolItem, EmailTemplateItem } from '../../../types';
import { problemLines, toProblem } from '../../../utils/problem';
import { EmailTemplateEditor } from '../components/EmailTemplateEditor';
import { EmailRevisionPicker } from '../components/EmailRevisionPicker';
import { EmailTestDialog } from '../components/EmailTestDialog';
import { EmailEventSelect, EmailPager, EmailSearch, EmailState, EmailStatus } from '../components/EmailUi';

export function EmailTemplates({ school, events, eventCode, onEventChange }: { school: EmailSchoolItem; events: EmailEventItem[]; eventCode: string; onEventChange: (value: string) => void }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [editor, setEditor] = useState<number | 'new' | null>(null);
  const [revisions, setRevisions] = useState<EmailTemplateItem | null>(null);
  const [test, setTest] = useState<EmailTemplateItem | null>(null);
  const keyword = useDebounce(search, 300);
  const list = useAsync(() => api.email.templates(school.id, { search: keyword, eventCode: eventCode || undefined, status: status || undefined, page, pageSize }), [school.id, keyword, eventCode, status, page, pageSize]);
  const notice = useNotice();
  const [busy, run] = useBusy();
  const change = (item: EmailTemplateItem, remove = false) => {
    const message = remove ? `Xóa mẫu email “${item.name}” chưa được sử dụng?` : `${item.status === 'ACTIVE' ? 'Ngừng' : 'Bắt đầu'} áp dụng mẫu email “${item.name}”?`;
    notice.confirm(message, () => void run(async () => {
      try {
        if (remove) await api.email.deleteTemplate(school.id, item.id, item.version);
        else await api.email.templateStatus(school.id, item.id, item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE', item.version);
        list.reload(); notice.success(remove ? 'Đã xóa mẫu email.' : 'Đã cập nhật trạng thái mẫu email.');
      } catch (error) { list.reload(); notice.error(problemLines(toProblem(error))); }
    }));
  };
  return <>
    <div className="email-toolbar">
      <EmailSearch value={search} onChange={value => { setSearch(value); setPage(1); }} />
      <EmailEventSelect schoolId={school.id} events={events} value={eventCode} onChange={value => { onEventChange(value); setPage(1); }} />
      <SelectField label="Trạng thái" value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="">Tất cả</option><option value="ACTIVE">Đang áp dụng</option><option value="INACTIVE">Ngừng áp dụng</option></SelectField>
      {school.canManageTemplates && <PcbButton disabled={busy || !events.length} onClick={() => setEditor('new')}>Thêm mẫu email</PcbButton>}
    </div>
    <section className="email-panel" aria-label="Danh sách mẫu email">
      <EmailState {...list} count={list.data?.items.length ?? 0} />
      {!!list.data?.items.length && <div className="pcb-table-wrap"><table className="pcb-table"><thead><tr><th>Mẫu email</th><th>Sự kiện</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
        <tbody>{list.data.items.map(item => <tr key={item.id}>
          <td><strong>{item.name}</strong><div className="sep-subline">{item.code}</div></td><td>{events.find(event => event.code === item.eventCode)?.name || item.eventCode}</td><td><EmailStatus status={item.status} /></td>
          <td><div className="email-actions"><PcbButton variant="secondary" size="sm" onClick={() => setRevisions(item)}>Phiên bản</PcbButton>
            {school.canManageTemplates && <><PcbButton variant="secondary" size="sm" disabled={busy} onClick={() => setEditor(item.id)}>Sửa</PcbButton>
              <PcbButton variant="secondary" size="sm" disabled={busy || item.status !== 'ACTIVE'} onClick={() => setTest(item)}>Gửi thử</PcbButton>
              <PcbButton variant="secondary" size="sm" disabled={busy} onClick={() => change(item)}>{item.status === 'ACTIVE' ? 'Ngừng áp dụng' : 'Kích hoạt'}</PcbButton>
              {item.canDelete && <PcbButton variant="danger" size="sm" disabled={busy} onClick={() => change(item, true)}>Xóa</PcbButton>}</>}
          </div></td>
        </tr>)}</tbody></table></div>}
      <EmailPager data={list.data} page={page} pageSize={pageSize} setPage={setPage} setPageSize={setPageSize} label="mẫu email" />
    </section>
    {editor && <EmailTemplateEditor schoolId={school.id} initialEventCode={eventCode} templateId={editor === 'new' ? undefined : editor} events={events} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); list.reload(); notice.success('Đã lưu mẫu email và phiên bản nội dung.'); }} />}
    {revisions && <EmailRevisionPicker schoolId={school.id} eventCode={revisions.eventCode} initialTemplate={revisions} onClose={() => setRevisions(null)} />}
    {test && <EmailTestDialog schoolId={school.id} template={test} onClose={() => setTest(null)} onQueued={() => { setTest(null); notice.success('Đã đưa email thử vào hàng đợi. Xem kết quả tại Lịch sử gửi.'); }} />}
    {notice.dialog}
  </>;
}

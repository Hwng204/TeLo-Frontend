import { useState } from 'react';
import { PcbButton } from '../../../components/pcb';
import { useAsync, useDebounce } from '../../../hooks';
import { api } from '../../../services/api';
import type { EmailRevisionItem, EmailTemplateItem } from '../../../types';
import { emailDateTime } from '../../../utils/email';
import { EmailDialog, EmailPager, EmailSearch, EmailState } from './EmailUi';

function RevisionList({ schoolId, template, onChoose }: {
  schoolId: number; template: EmailTemplateItem; onChoose?: (revision: EmailRevisionItem, template: EmailTemplateItem) => void;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [preview, setPreview] = useState<EmailRevisionItem | null>(null);
  const list = useAsync(() => api.email.revisions(schoolId, template.id, { page, pageSize }), [schoolId, template.id, page, pageSize]);
  return <>
    <h3>{template.name}</h3>
    <EmailState {...list} count={list.data?.items.length ?? 0} />
    <ul className="email-options">{list.data?.items.map(revision => <li key={revision.id}>
      <span><strong>Phiên bản {revision.revision}</strong><small>{revision.subject}</small><small>{emailDateTime(revision.createdAt)}</small></span>
      <div className="email-actions"><PcbButton size="sm" variant="secondary" onClick={() => setPreview(revision)}>Xem nội dung</PcbButton>
        {onChoose && <PcbButton size="sm" onClick={() => onChoose(revision, template)}>Chọn phiên bản</PcbButton>}</div>
    </li>)}</ul>
    <EmailPager data={list.data} page={page} pageSize={pageSize} setPage={setPage} setPageSize={setPageSize} label="phiên bản" />
    {preview && <EmailDialog title={`Phiên bản ${preview.revision}`} onClose={() => setPreview(null)}>
      <h3>{preview.subject}</h3><pre className="email-content">{preview.body}</pre>
    </EmailDialog>}
  </>;
}

export function EmailRevisionPicker({ schoolId, eventCode, initialTemplate, onChoose, onClose }: {
  schoolId: number; eventCode: string; initialTemplate?: EmailTemplateItem;
  onChoose?: (revision: EmailRevisionItem, template: EmailTemplateItem) => void; onClose: () => void;
}) {
  const [template, setTemplate] = useState(initialTemplate ?? null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const keyword = useDebounce(search, 300);
  const list = useAsync(() => template ? Promise.resolve(null) : api.email.templates(schoolId, { eventCode, status: 'ACTIVE', search: keyword, page, pageSize }), [schoolId, eventCode, keyword, page, pageSize, template?.id]);
  return <EmailDialog title={onChoose ? 'Chọn phiên bản mẫu email' : 'Lịch sử phiên bản'} onClose={onClose}>
    {template ? <>
      {!initialTemplate && <PcbButton variant="ghost" onClick={() => setTemplate(null)}>← Chọn mẫu khác</PcbButton>}
      <RevisionList schoolId={schoolId} template={template} onChoose={onChoose} />
    </> : <>
      <EmailSearch value={search} onChange={value => { setSearch(value); setPage(1); }} />
      <EmailState {...list} count={list.data?.items.length ?? 0} />
      <ul className="email-options">{list.data?.items.map(item => <li key={item.id}>
        <span><strong>{item.name}</strong><small>{item.code}</small></span><PcbButton variant="secondary" onClick={() => setTemplate(item)}>Xem phiên bản</PcbButton>
      </li>)}</ul>
      <EmailPager data={list.data ?? undefined} page={page} pageSize={pageSize} setPage={setPage} setPageSize={setPageSize} label="mẫu email" />
    </>}
  </EmailDialog>;
}

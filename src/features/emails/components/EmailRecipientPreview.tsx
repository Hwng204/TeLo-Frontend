import { useState } from 'react';
import { useAsync } from '../../../hooks';
import { api } from '../../../services/api';
import type { SaveEmailConfigRequest } from '../../../types';
import { EmailDialog, EmailPager, EmailState } from './EmailUi';

export function EmailRecipientPreview({ schoolId, configuration, onClose }: { schoolId: number; configuration: SaveEmailConfigRequest; onClose: () => void }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const list = useAsync(() => api.email.previewRecipients(schoolId, configuration, { page, pageSize }), [schoolId, configuration, page, pageSize]);
  return <EmailDialog title="Xem trước người nhận" onClose={onClose}>
    <EmailState {...list} count={list.data?.items.length ?? 0} />
    <ul className="email-options">{list.data?.items.map(item => <li key={item.id}><span><strong>{item.name}</strong><small>{item.email}</small><small>{item.branchName}</small></span></li>)}</ul>
    <EmailPager data={list.data} page={page} pageSize={pageSize} setPage={setPage} setPageSize={setPageSize} label="người nhận sau khi loại trừ và bỏ trùng" />
  </EmailDialog>;
}

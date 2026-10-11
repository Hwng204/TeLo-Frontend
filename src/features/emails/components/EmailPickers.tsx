import { useState } from 'react';
import { PcbButton } from '../../../components/pcb';
import { useAsync, useDebounce } from '../../../hooks';
import { api } from '../../../services/api';
import type { EmailRecipientOption, EmailSchoolItem } from '../../../types';
import { EmailDialog, EmailPager, EmailSearch, EmailState } from './EmailUi';

export function EmailSchoolPicker({ onChoose, onClose }: { onChoose: (school: EmailSchoolItem) => void; onClose: () => void }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const keyword = useDebounce(search, 300);
  const list = useAsync(() => api.email.schools({ search: keyword, page, pageSize }), [keyword, page, pageSize]);
  return <EmailDialog title="Chọn trường" onClose={onClose}>
    <EmailSearch value={search} onChange={value => { setSearch(value); setPage(1); }} />
    <EmailState {...list} count={list.data?.items.length ?? 0} />
    <ul className="email-options">{list.data?.items.map(school => <li key={school.id}>
      <span><strong>{school.name}</strong><small>{school.code}</small></span>
      <PcbButton variant="secondary" size="sm" onClick={() => onChoose(school)}>Chọn trường</PcbButton>
    </li>)}</ul>
    <EmailPager data={list.data} page={page} pageSize={pageSize} setPage={setPage} setPageSize={setPageSize} label="trường" />
  </EmailDialog>;
}

export function EmailRecipientPicker({ schoolId, kind, onChoose, onClose, multiple = true }: {
  schoolId: number; kind: 'role' | 'user'; onChoose: (items: EmailRecipientOption[]) => void; onClose: () => void; multiple?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<EmailRecipientOption[]>([]);
  const keyword = useDebounce(search, 300);
  const list = useAsync(() => api.email.recipients(schoolId, kind, { search: keyword, page, pageSize }), [schoolId, kind, keyword, page, pageSize]);
  const toggle = (item: EmailRecipientOption) => setSelected(current => {
    if (current.some(value => value.id === item.id)) return current.filter(value => value.id !== item.id);
    return multiple ? [...current, item] : [item];
  });
  return <EmailDialog title={kind === 'role' ? 'Chọn nhóm theo vai trò' : 'Chọn người nhận'} onClose={onClose}>
    <EmailSearch value={search} onChange={value => { setSearch(value); setPage(1); }} />
    <EmailState {...list} count={list.data?.items.length ?? 0} />
    <ul className="email-options">{list.data?.items.map(item => {
      const checked = selected.some(value => value.id === item.id);
      return <li key={item.id}><label className="email-choice">
        <input type={multiple ? 'checkbox' : 'radio'} name="email-recipient" checked={checked}
          disabled={!checked && multiple && selected.length >= 200} onChange={() => toggle(item)} />
        <span><strong>{item.name}</strong><small>{item.email || item.code}</small>{item.branchName && <small>{item.branchName}</small>}</span>
      </label></li>;
    })}</ul>
    <EmailPager data={list.data} page={page} pageSize={pageSize} setPage={setPage} setPageSize={setPageSize} label={kind === 'role' ? 'vai trò' : 'người dùng'} />
    <div className="sep-actions"><span className="sep-actions__lead" role="status">Đã chọn {selected.length}{multiple ? '/200 trên các trang' : ''}</span>
      <PcbButton variant="secondary" onClick={onClose}>Hủy</PcbButton>
      <PcbButton disabled={!selected.length} onClick={() => onChoose(selected)}>Áp dụng lựa chọn</PcbButton>
    </div>
  </EmailDialog>;
}

import { useState } from 'react';
import { PcbButton } from '../../../components/pcb';
import { useAsync } from '../../../hooks/useAsync';
import { useBusy } from '../../../hooks/useBusy';
import { useDebounce } from '../../../hooks/useDebounce';
import { api } from '../../../services/api';
import type { UserRoles } from '../../../types';
import { canAssignRole, identityConflict, identityError, roleScopeLabel } from '../../../utils/identity';
import { IdentityDialog, IdentityPager, IdentitySearch, IdentityState } from './IdentityUi';

function UserRoleForm({ data, onSaved, onClose, busy, run }: {
  data: UserRoles;
  onSaved: () => void;
  onClose: () => void;
  busy: boolean;
  run: (action: () => Promise<unknown>) => Promise<void>
}) {
  const [selected, setSelected] = useState(data.roles);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [failure, setFailure] = useState('');
  const [stale, setStale] = useState(false);
  const debounced = useDebounce(search, 300);
  const result = useAsync(() => api.roles.list({
    status: 'ACTIVE',
    search: debounced,
    page,
    pageSize
  }), [debounced, page, pageSize]);
  const save = () => void run(async () => {
    setFailure('');
    try {
      await api.identity.assignRoles(data.user.id, selected.map(role => role.id), data.user.version);
      onSaved();
    }
    catch (error) {
      setFailure(identityError(error));
      if (identityConflict(error)) setStale(true);
    }
  });
  return <>
    <p className="sep-muted">{data.user.username} · {data.user.schoolName || 'Không thuộc trường'}{data.user.schoolBranchName ? ` / ${data.user.schoolBranchName}` : ''}</p>
    {failure && <div className="sep-alert" role="alert">
      {failure}
    </div>}
    {stale && <p className="sep-alert sep-alert--info">Dữ liệu đã thay đổi. Đóng và mở lại để lấy danh sách vai trò mới nhất.</p>}
    <p role="status">Đã chọn {selected.length}/100 vai trò trên các trang. Vai trò đã gán được giữ nguyên cho đến khi bạn bỏ chọn.</p>
    <div className="identity-chips">
      {selected.map(role => <PcbButton
        key={role.id}
        size="sm"
        variant="secondary"
        disabled={busy || stale}
        aria-label={`Bỏ vai trò ${role.name}`}
        onClick={() => setSelected(values => values.filter(item => item.id !== role.id))}
      >{role.name}{role.status !== 'ACTIVE' ? ' (ngừng áp dụng)' : ''} ×</PcbButton>)}
    </div>
    <IdentitySearch
      label="Tìm vai trò để gán"
      value={search}
      onChange={value => {
        setSearch(value);
        setPage(1);
      }}
    />
    <IdentityState {...result} count={result.data?.items.length ?? 0} />
    <ul className="identity-options">
      {result.data?.items.map(role => {
        const checked = selected.some(item => item.id === role.id);
        const eligible = canAssignRole(role, data.user) && data.user.status === 'ACTIVE';
        return <li key={role.id}>
          <label className="identity-choice">
            <input
              type="checkbox"
              checked={checked}
              disabled={busy || stale || (!checked && (!eligible || selected.length >= 100))}
              onChange={() => setSelected(values => values.some(item => item.id === role.id) ? values.filter(item => item.id !== role.id) : [...values, role])}
            />
            <span>
              <strong>
                {role.name}
              </strong>
              <small>{role.code} · {roleScopeLabel(role)}</small>
              {!eligible && !checked && <small>Không phù hợp với trạng thái hoặc phạm vi người dùng.</small>}
            </span>
          </label>
        </li>;
      })}
    </ul>
    <IdentityPager
      data={result.data}
      page={page}
      pageSize={pageSize}
      setPage={setPage}
      setPageSize={setPageSize}
      label="vai trò"
    />
    {!selected.length && <p className="sep-alert sep-alert--warn">Lưu sẽ thu hồi toàn bộ vai trò hiện có của người dùng này.</p>}
    <p className="sep-muted">Sau khi thay đổi vai trò, người dùng cần đăng nhập lại để nhận quyền mới.</p>
    <div className="sep-actions">
      <PcbButton
        variant="secondary"
        disabled={busy}
        onClick={onClose}
      >Hủy</PcbButton>
      <PcbButton disabled={busy || stale || selected.length > 100} onClick={save}>
        {busy ? 'Đang lưu…' : 'Lưu vai trò'}
      </PcbButton>
    </div>
  </>;
}
export function UserRoleEditor({ userId, userName, onClose, onSaved }: {
  userId: number;
  userName: string;
  onClose: () => void;
  onSaved: () => void
}) {
  const result = useAsync(() => api.identity.userRoles(userId), [userId]);
  const [busy, run] = useBusy();
  return <IdentityDialog
    title={`Gán vai trò · ${userName}`}
    onClose={onClose}
    busy={busy}
  >
    <IdentityState {...result} count={result.data ? 1 : 0} />
    {result.data && <UserRoleForm
      key={result.data.user.version}
      data={result.data}
      onClose={onClose}
      onSaved={onSaved}
      busy={busy}
      run={run}
    />}
  </IdentityDialog>;
}

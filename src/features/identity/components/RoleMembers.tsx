import { useState } from 'react';
import { PcbButton } from '../../../components/pcb';
import { useAsync } from '../../../hooks/useAsync';
import { useBusy } from '../../../hooks/useBusy';
import { useDebounce } from '../../../hooks/useDebounce';
import { useNotice } from '../../../hooks/useNotice';
import { api } from '../../../services/api';
import type { RoleItem } from '../../../types';
import { identityConflict, identityError, roleScopeLabel, toggleSelection } from '../../../utils/identity';
import { IdentityDialog, IdentityPager, IdentitySearch, IdentityState } from './IdentityUi';

function AddRoleMembers({ role, onClose, onSaved }: {
  role: RoleItem;
  onClose: () => void;
  onSaved: () => void
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<number[]>([]);
  const [failure, setFailure] = useState('');
  const [stale, setStale] = useState(false);
  const [busy, run] = useBusy();
  const debounced = useDebounce(search, 300);
  const result = useAsync(() => api.identity.users({
    eligibleForRoleId: role.id,
    search: debounced,
    page,
    pageSize
  }), [role.id, debounced, page, pageSize]);
  const save = () => void run(async () => {
    setFailure('');
    try {
      await api.roles.addUsers(role.id, selected, role.version);
      onSaved();
    }
    catch (error) {
      setFailure(identityError(error));
      if (identityConflict(error)) setStale(true);
    }
  });
  return <IdentityDialog
    title={`Thêm người dùng vào “${role.name}”`}
    onClose={onClose}
    busy={busy}
  >
    <p className="sep-muted">{roleScopeLabel(role)}. Chỉ hiển thị người dùng đang hoạt động, đúng phạm vi và chưa có vai trò này.</p>
    {failure && <div className="sep-alert" role="alert">
      {failure}
    </div>}
    {stale && <p className="sep-alert sep-alert--info">Dữ liệu đã thay đổi. Đóng và mở lại hộp thoại để kiểm tra trước khi gán.</p>}
    <IdentitySearch
      label="Tìm tài khoản, họ tên hoặc email"
      value={search}
      onChange={value => {
        setSearch(value);
        setPage(1);
      }}
    />
    <IdentityState {...result} count={result.data?.items.length ?? 0} />
    <ul className="identity-options">
      {result.data?.items.map(user => <li key={user.id}>
        <label className="identity-choice">
          <input
            type="checkbox"
            checked={selected.includes(user.id)}
            disabled={busy || stale || (selected.length >= 100 && !selected.includes(user.id))}
            onChange={() => setSelected(ids => toggleSelection(ids, user.id))}
          />
          <span>
            <strong>
              {user.fullName}
            </strong>
            <small>{user.username} · {user.email}</small>
            <small>
              {user.schoolName || 'Không thuộc trường'}
              {user.schoolBranchName ? ` / ${user.schoolBranchName}` : ''}
            </small>
          </span>
        </label>
      </li>)}
    </ul>
    <IdentityPager
      data={result.data}
      page={page}
      pageSize={pageSize}
      setPage={setPage}
      setPageSize={setPageSize}
      label="người dùng"
    />
    <div className="sep-actions">
      <span className="sep-actions__lead" role="status">Đã chọn {selected.length}/100 người dùng trên các trang</span>
      <PcbButton
        variant="ghost"
        disabled={busy || !selected.length}
        onClick={() => setSelected([])}
      >Bỏ chọn tất cả</PcbButton>
      <PcbButton
        variant="secondary"
        disabled={busy}
        onClick={onClose}
      >Hủy</PcbButton>
      <PcbButton disabled={busy || stale || !selected.length} onClick={save}>
        {busy ? 'Đang gán…' : 'Gán vai trò'}
      </PcbButton>
    </div>
  </IdentityDialog>;
}

export function RoleMembers({ role, onChanged, refreshing }: {
  role: RoleItem;
  onChanged: () => void;
  refreshing: boolean
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [adding, setAdding] = useState(false);
  const [busy, run] = useBusy();
  const notice = useNotice();
  const debounced = useDebounce(search, 300);
  const result = useAsync(() => api.identity.users({
    roleId: role.id,
    search: debounced,
    page,
    pageSize
  }), [role.id, role.version, debounced, page, pageSize]);
  const remove = (id: number, name: string) => notice.confirm(`Thu hồi vai trò “${role.name}” của ${name}? Lịch sử cấp quyền vẫn được giữ lại.`, () => void run(async () => {
    try {
      await api.roles.removeUser(role.id, id, role.version);
      if (result.data?.items.length === 1 && page > 1) setPage(page - 1);
      result.reload();
      onChanged();
      notice.success('Đã thu hồi vai trò.');
    }
    catch (error) {
      onChanged();
      result.reload();
      notice.error(identityError(error));
    }
  }), 'Thu hồi');
  return <section className="identity-panel" aria-label={`Người dùng có vai trò ${role.name}`}>
    <h2>
      {role.name}
    </h2>
    <p className="sep-muted">
      {roleScopeLabel(role)}
    </p>
    <div className="identity-toolbar">
      <IdentitySearch
        label="Tìm người dùng trong vai trò"
        value={search}
        onChange={value => {
          setSearch(value);
          setPage(1);
        }}
      />
      <PcbButton disabled={busy || refreshing || role.status !== 'ACTIVE'} onClick={() => setAdding(true)}>Thêm người dùng</PcbButton>
    </div>
    {role.status !== 'ACTIVE' && <p className="sep-alert sep-alert--info">Vai trò ngừng áp dụng: giữ lại danh sách đã gán, không cho cấp mới.</p>}
    <IdentityState {...result} count={result.data?.items.length ?? 0} />
    <ul className="identity-options">
      {result.data?.items.map(user => <li key={user.id}>
        <span>
          <strong>
            {user.fullName}
          </strong>
          <small>
            {user.username}
          </small>
          <small>
            {user.email}
          </small>
        </span>
        <PcbButton
          variant="danger"
          size="sm"
          disabled={busy || refreshing}
          onClick={() => remove(user.id, user.fullName)}
          aria-label={`Thu hồi vai trò của ${user.fullName}`}
        >Thu hồi</PcbButton>
      </li>)}
    </ul>
    <IdentityPager
      data={result.data}
      page={page}
      pageSize={pageSize}
      setPage={setPage}
      setPageSize={setPageSize}
      label="người dùng"
    />
    {adding && <AddRoleMembers
      role={role}
      onClose={() => {
        setAdding(false);
        onChanged();
      }}
      onSaved={() => {
        setAdding(false);
        onChanged();
        result.reload();
        notice.success('Đã gán vai trò cho các người dùng đã chọn.');
      }}
    />}
    {notice.dialog}
  </section>;
}

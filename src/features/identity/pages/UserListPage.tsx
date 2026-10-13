import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../components/common/PageHeader';
import { RowAction, RowActionButton } from '../../../components/common/RowAction';
import { PcbButton, SelectField } from '../../../components/pcb';
import { useAsync } from '../../../hooks/useAsync';
import { useBusy } from '../../../hooks/useBusy';
import { useDebounce } from '../../../hooks/useDebounce';
import { useNotice } from '../../../hooks/useNotice';
import { api } from '../../../services/api';
import type { IdentityUser, UserStatus } from '../../../types';
import { emptyScope, identityError } from '../../../utils/identity';
import { getUserId } from '../../../utils/jwt';
import { storage } from '../../../utils/storage';
import { IdentityPager, IdentitySearch, IdentityState, IdentityStatusBadge } from '../components/IdentityUi';
import { UserRoleEditor } from '../components/UserRoleEditor';
import './identity.css';

export function UserListPage() {
  const navigate = useNavigate();
  const currentUserId = getUserId();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [scope, setScope] = useState(() => {
    const s = storage.getSelectedBranch();
    if (s.schoolId || s.branchId) {
      return {
        schoolId: s.schoolId ? Number(s.schoolId) : null,
        schoolName: s.schoolName || null,
        schoolBranchId: s.branchId ? Number(s.branchId) : null,
        schoolBranchName: s.branchName || null,
      };
    }
    return emptyScope;
  });

  useEffect(() => {
    const handleBranchChange = () => {
      const s = storage.getSelectedBranch();
      if (s.schoolId || s.branchId) {
        setScope({
          schoolId: s.schoolId ? Number(s.schoolId) : null,
          schoolName: s.schoolName || null,
          schoolBranchId: s.branchId ? Number(s.branchId) : null,
          schoolBranchName: s.branchName || null,
        });
      } else {
        setScope(emptyScope);
      }
      setPage(1);
    };
    window.addEventListener('branch_changed', handleBranchChange);
    return () => window.removeEventListener('branch_changed', handleBranchChange);
  }, []);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [roleUser, setRoleUser] = useState<IdentityUser | null>(null);
  const [busy, run] = useBusy();
  const notice = useNotice();
  const debounced = useDebounce(search, 300);
  const result = useAsync(() => api.identity.users({
    search: debounced,
    status: status || undefined,
    schoolId: scope.schoolId ?? undefined,
    schoolBranchId: scope.schoolBranchId ?? undefined,
    page,
    pageSize,
  }), [debounced, status, scope, page, pageSize]);

  const refresh = () => result.reload();
  const isSelf = (user: IdentityUser) => String(user.id) === currentUserId;
  const changeStatus = (user: IdentityUser, nextStatus: UserStatus) => {
    const action = nextStatus === 'ACTIVE' ? 'kích hoạt' : 'ngừng hoạt động';
    notice.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} tài khoản “${user.username}”? Người dùng sẽ phải đăng nhập lại.`, () => void run(async () => {
      try {
        await api.identity.userStatus(user.id, nextStatus, user.version);
        refresh();
        notice.success(`Đã ${action} tài khoản.`);
      } catch (error) {
        refresh();
        notice.error(identityError(error));
      }
    }));
  };
  const remove = (user: IdentityUser) => notice.confirm(
    `Xóa tài khoản “${user.username}”? Chỉ tài khoản chưa gắn hồ sơ giáo viên/học sinh và không phải tài khoản quản trị mới có thể xóa.`,
    () => void run(async () => {
      try {
        await api.identity.removeUser(user.id, user.version);
        if (result.data?.items.length === 1 && page > 1) setPage(page - 1);
        else refresh();
        notice.success('Đã xóa tài khoản.');
      } catch (error) {
        refresh();
        notice.error(identityError(error));
      }
    }),
    'Xóa tài khoản',
  );

  return <div className="sep-page identity-page">
    <PageHeader title="Quản lý người dùng" inline />
    <p className="sep-muted">Quản lý thông tin đăng nhập, trạng thái và vai trò của tài khoản trong hệ thống.</p>
    <div className="identity-toolbar">
      <IdentitySearch
        label="Tìm tài khoản, họ tên hoặc email"
        value={search}
        onChange={value => {
          setSearch(value);
          setPage(1);
        }}
      />
      <SelectField
        label="Trạng thái tài khoản"
        value={status}
        onChange={event => {
          setStatus(event.target.value);
          setPage(1);
        }}
      >
        <option value="">Tất cả trạng thái</option>
        <option value="ACTIVE">Đang hoạt động</option>
        <option value="INACTIVE">Ngừng hoạt động</option>
        <option value="LOCKED">Đã khóa</option>
      </SelectField>
      <PcbButton variant="secondary" disabled={busy} onClick={() => navigate('/users/create')}>Thêm tài khoản</PcbButton>
      <PcbButton disabled={busy} onClick={() => navigate('/users/create-admin')}>Thêm tài khoản Admin</PcbButton>
    </div>
    <section className="identity-panel" aria-label="Danh sách người dùng">
      <IdentityState {...result} count={result.data?.items.length ?? 0} />
      {!!result.data?.items.length && <div className="pcb-table-wrap">
        <table className="pcb-table identity-user-table">
          <thead>
            <tr>
              <th>Tài khoản</th>
              <th>Họ và tên</th>
              <th>Trường / Phân hiệu</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {result.data.items.map(user => {
              const ownAccount = isSelf(user);
              return <tr key={user.id}>
                <td>
                  <strong>{user.username}</strong>
                  <div className="sep-subline">{user.email}</div>
                </td>
                <td><strong>{user.fullName}</strong></td>
                <td>
                  {user.schoolName || 'Toàn hệ thống'}
                  {user.schoolBranchName && <div className="sep-subline">{user.schoolBranchName}</div>}
                </td>
                <td>
                  <IdentityStatusBadge status={user.status} account />
                  {ownAccount && <div className="sep-subline">Tài khoản đang dùng</div>}
                </td>
                <td>
                  <div className="sep-row-actions">
                    <RowAction to={`/users/${user.id}/edit`} icon="edit" label={`Chỉnh sửa ${user.username}`} />
                    <RowActionButton icon="manage_accounts" label={`Phân quyền ${user.username}`} disabled={busy}
                      onClick={() => setRoleUser(user)} />
                    {user.status === 'ACTIVE'
                      ? <RowActionButton icon="person_off"
                        label={ownAccount ? 'Không thể tự ngừng hoạt động tài khoản đang dùng' : `Ngừng hoạt động ${user.username}`}
                        disabled={busy || ownAccount} onClick={() => changeStatus(user, 'INACTIVE')} />
                      : <RowActionButton icon="person_add" label={`Kích hoạt ${user.username}`} disabled={busy}
                        onClick={() => changeStatus(user, 'ACTIVE')} />}
                    <RowActionButton icon="delete"
                      label={ownAccount ? 'Không thể tự xóa tài khoản đang dùng' : `Xóa ${user.username}`}
                      disabled={busy || ownAccount} onClick={() => remove(user)} />
                  </div>
                </td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>}
      <IdentityPager
        data={result.data}
        page={page}
        pageSize={pageSize}
        setPage={setPage}
        setPageSize={setPageSize}
        label="người dùng"
      />
    </section>
    {roleUser && <UserRoleEditor
      userId={roleUser.id}
      userName={roleUser.fullName}
      onClose={() => setRoleUser(null)}
      onSaved={() => {
        setRoleUser(null);
        refresh();
        notice.success('Đã cập nhật vai trò người dùng.');
      }}
    />}
    {notice.dialog}
  </div>;
}

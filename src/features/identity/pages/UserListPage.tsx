import { useState } from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { PcbButton, SelectField } from '../../../components/pcb';
import { useAsync } from '../../../hooks/useAsync';
import { useBusy } from '../../../hooks/useBusy';
import { useDebounce } from '../../../hooks/useDebounce';
import { useNotice } from '../../../hooks/useNotice';
import { api } from '../../../services/api';
import type { IdentityUser, UserStatus } from '../../../types';
import { emptyScope, identityError } from '../../../utils/identity';
import { IdentityPager, IdentitySearch, IdentityState, IdentityStatusBadge } from '../components/IdentityUi';
import { ResetUserPasswordDialog } from '../components/ResetUserPasswordDialog';
import { ScopeFields } from '../components/ScopeFields';
import { UserEditor } from '../components/UserEditor';
import { UserRoleEditor } from '../components/UserRoleEditor';
import './identity.css';

type EditorState = { item?: IdentityUser; admin?: boolean };

export function UserListPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [scope, setScope] = useState(emptyScope);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [roleUser, setRoleUser] = useState<IdentityUser | null>(null);
  const [passwordUser, setPasswordUser] = useState<IdentityUser | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
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
    <p className="sep-muted">Quản lý thông tin đăng nhập, mật khẩu, trạng thái và vai trò của tài khoản trong hệ thống.</p>
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
      <PcbButton variant="secondary" disabled={busy} onClick={() => setEditor({})}>Thêm tài khoản</PcbButton>
      <PcbButton disabled={busy} onClick={() => setEditor({ admin: true })}>Thêm tài khoản Admin</PcbButton>
    </div>
    <ScopeFields
      filter
      value={scope}
      onChange={value => {
        setScope(value);
        setPage(1);
      }}
    />
    <section className="identity-panel" aria-label="Danh sách người dùng">
      <IdentityState {...result} count={result.data?.items.length ?? 0} />
      {!!result.data?.items.length && <div className="pcb-table-wrap">
        <table className="pcb-table identity-user-table">
          <thead>
            <tr>
              <th>Tài khoản</th>
              <th>Mật khẩu</th>
              <th>Họ và tên</th>
              <th>Trường / Phân hiệu</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {result.data.items.map(user => <tr key={user.id}>
              <td>
                <strong>{user.username}</strong>
                <div className="sep-subline">{user.email}</div>
              </td>
              <td>
                <span className="identity-password" aria-label="Mật khẩu đã được mã hóa">••••••••</span>
                <div className="sep-subline">Không thể xem lại</div>
                <PcbButton variant="ghost" size="sm" disabled={busy} onClick={() => setPasswordUser(user)}>Đặt lại</PcbButton>
              </td>
              <td><strong>{user.fullName}</strong></td>
              <td>
                {user.schoolName || 'Toàn hệ thống'}
                {user.schoolBranchName && <div className="sep-subline">{user.schoolBranchName}</div>}
              </td>
              <td><IdentityStatusBadge status={user.status} account /></td>
              <td>
                <div className="identity-actions">
                  <PcbButton variant="secondary" size="sm" disabled={busy} onClick={() => setEditor({ item: user })}>Sửa</PcbButton>
                  <PcbButton variant="secondary" size="sm" disabled={busy} onClick={() => setRoleUser(user)}>Vai trò</PcbButton>
                  {user.status === 'ACTIVE'
                    ? <PcbButton className="identity-status-action--stop" size="sm" disabled={busy} onClick={() => changeStatus(user, 'INACTIVE')}>Ngừng</PcbButton>
                    : <PcbButton className="identity-status-action--start" size="sm" disabled={busy} onClick={() => changeStatus(user, 'ACTIVE')}>Kích hoạt</PcbButton>}
                </div>
              </td>
            </tr>)}
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
    {editor && <UserEditor
      {...editor}
      onClose={() => setEditor(null)}
      onConflict={refresh}
      onDelete={user => {
        setEditor(null);
        remove(user);
      }}
      onSaved={() => {
        setEditor(null);
        refresh();
        notice.success(editor.item ? 'Đã cập nhật tài khoản.' : editor.admin ? 'Đã tạo tài khoản Admin.' : 'Đã tạo tài khoản.');
      }}
    />}
    {passwordUser && <ResetUserPasswordDialog
      user={passwordUser}
      onClose={() => setPasswordUser(null)}
      onConflict={refresh}
      onSaved={() => {
        setPasswordUser(null);
        refresh();
        notice.success('Đã đặt lại mật khẩu. Các phiên đăng nhập cũ đã hết hiệu lực.');
      }}
    />}
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

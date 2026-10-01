import { useState } from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { PcbButton, SelectField } from '../../../components/pcb';
import { useAsync } from '../../../hooks/useAsync';
import { useDebounce } from '../../../hooks/useDebounce';
import { useNotice } from '../../../hooks/useNotice';
import { api } from '../../../services/api';
import type { IdentityUser } from '../../../types';
import { IdentityPager, IdentitySearch, IdentityState, IdentityStatusBadge } from '../components/IdentityUi';
import { ScopeFields } from '../components/ScopeFields';
import { emptyScope } from '../../../utils/identity';
import { UserRoleEditor } from '../components/UserRoleEditor';
import './identity.css';

export function UserListPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [scope, setScope] = useState(emptyScope);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState<IdentityUser | null>(null);
  const notice = useNotice();
  const debounced = useDebounce(search, 300);
  const result = useAsync(() => api.identity.users({
    search: debounced,
    status: status || undefined,
    schoolId: scope.schoolId ?? undefined,
    schoolBranchId: scope.schoolBranchId ?? undefined,
    page,
    pageSize
  }), [debounced, status, scope, page, pageSize]);
  return <div className="sep-page identity-page">
    <PageHeader title="Vai trò người dùng" inline />
    <p className="sep-muted">Gán một hoặc nhiều vai trò theo trường và phân hiệu của người dùng.</p>
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
        label="Trạng thái người dùng"
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
        <table className="pcb-table">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Email</th>
              <th>Trường / Phân hiệu</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {result.data.items.map(user => <tr key={user.id}>
              <td>
                <strong>
                  {user.fullName}
                </strong>
                <div className="sep-subline">
                  {user.username}
                </div>
              </td>
              <td>
                {user.email}
              </td>
              <td>
                {user.schoolName || 'Không thuộc trường'}
                <div className="sep-subline">
                  {user.schoolBranchName}
                </div>
              </td>
              <td>
                <IdentityStatusBadge status={user.status} account />
              </td>
              <td>
                <PcbButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelected(user)}
                >Gán vai trò</PcbButton>
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
    {selected && <UserRoleEditor
      userId={selected.id}
      userName={selected.fullName}
      onClose={() => setSelected(null)}
      onSaved={() => {
        setSelected(null);
        result.reload();
        notice.success('Đã cập nhật vai trò người dùng.');
      }}
    />}
    {notice.dialog}
  </div>;
}

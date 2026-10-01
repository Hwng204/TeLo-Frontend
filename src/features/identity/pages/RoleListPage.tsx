import { useState } from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { PcbButton, SelectField } from '../../../components/pcb';
import { useAsync } from '../../../hooks/useAsync';
import { useBusy } from '../../../hooks/useBusy';
import { useDebounce } from '../../../hooks/useDebounce';
import { useNotice } from '../../../hooks/useNotice';
import { api } from '../../../services/api';
import type { RoleItem } from '../../../types';
import { emptyScope, identityError, roleScopeLabel } from '../../../utils/identity';
import { IdentityEditor } from '../components/IdentityEditor';
import { IdentityPager, IdentitySearch, IdentityState, IdentityStatusBadge } from '../components/IdentityUi';
import { RoleMembers } from '../components/RoleMembers';
import { ScopeFields } from '../components/ScopeFields';
import './identity.css';

export function RoleListPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [scope, setScope] = useState(emptyScope);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState<RoleItem | null>(null);
  const selectedId = selected?.id ?? null;
  const [editor, setEditor] = useState<RoleItem | 'new' | null>(null);
  const debounced = useDebounce(search, 300);
  const result = useAsync(() => api.roles.list({
    search: debounced,
    status: status || undefined,
    schoolId: scope.schoolId ?? undefined,
    schoolBranchId: scope.schoolBranchId ?? undefined,
    page,
    pageSize
  }), [debounced, status, scope, page, pageSize]);
  const detail = useAsync(() => selectedId ? api.roles.get(selectedId) : Promise.resolve(null), [selectedId]);
  const refresh = () => {
    result.reload();
    detail.reload();
  };
  const notice = useNotice();
  const [busy, run] = useBusy();
  const mutate = (item: RoleItem, remove = false) => notice.confirm(remove ? `Xóa vai trò “${item.name}” chưa được sử dụng?` : `${item.status === 'ACTIVE' ? 'Ngừng' : 'Bắt đầu'} áp dụng vai trò “${item.name}”? Phiên đăng nhập của người dùng liên quan sẽ cần đăng nhập lại.`, () => void run(async () => {
    try {
      if (remove) {
        await api.roles.remove(item.id, item.version);
        if (selectedId === item.id) setSelected(null);
      }
      else await api.roles.status(item.id, item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE', item.version);
      if (remove && result.data?.items.length === 1 && page > 1) setPage(page - 1);
      refresh();
      notice.success(remove ? 'Đã xóa vai trò.' : 'Đã cập nhật trạng thái vai trò.');
    } catch (error) {
      refresh();
      notice.error(identityError(error));
    }
  }));
  return <div className="sep-page identity-page">
    <PageHeader title="Quản lý vai trò" inline />
    <div className="identity-toolbar">
      <IdentitySearch value={search} onChange={value => {
        setSearch(value);
        setPage(1);
      }} />
      <SelectField
        label="Trạng thái"
        value={status}
        onChange={event => {
          setStatus(event.target.value);
          setPage(1);
        }}
      >
        <option value="">Tất cả trạng thái</option>
        <option value="ACTIVE">Đang áp dụng</option>
        <option value="INACTIVE">Ngừng áp dụng</option>
      </SelectField>
      <PcbButton disabled={busy} onClick={() => setEditor('new')}>Thêm vai trò</PcbButton>
    </div>
    <ScopeFields
      value={scope}
      filter
      onChange={value => {
        setScope(value);
        setPage(1);
      }}
    />
    <div className="identity-split">
      <section className="identity-panel" aria-label="Danh sách vai trò">
        <IdentityState {...result} count={result.data?.items.length ?? 0} />
        {!!result.data?.items.length && <div className="pcb-table-wrap">
          <table className="pcb-table">
            <thead>
              <tr>
                <th>Vai trò</th>
                <th>Phạm vi</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {result.data.items.map(item => <tr key={item.id} className={selectedId === item.id ? 'identity-selected' : ''}>
                <td>
                  <PcbButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelected(item)}
                    aria-pressed={selectedId === item.id}
                  >
                    {item.name}
                  </PcbButton>
                  <div className="sep-subline">
                    {item.code}
                  </div>
                  <div className="sep-subline">{item.userCount} người dùng{item.isSystem ? ' · Hệ thống' : ''}</div>
                </td>
                <td>
                  {roleScopeLabel(item)}
                </td>
                <td>
                  <IdentityStatusBadge status={item.status} />
                </td>
                <td>
                  <div className="identity-actions">
                    <PcbButton
                      variant="secondary"
                      size="sm"
                      disabled={busy}
                      onClick={() => setEditor(item)}
                    >Sửa</PcbButton>
                    {!['ADMIN', 'Admin', 'OperationalAdmin'].includes(item.code) && <PcbButton
                      variant="secondary"
                      size="sm"
                      disabled={busy}
                      onClick={() => mutate(item)}
                    >
                      {item.status === 'ACTIVE' ? 'Ngừng áp dụng' : 'Kích hoạt'}
                    </PcbButton>}
                    {item.canDelete && <PcbButton
                      variant="danger"
                      size="sm"
                      disabled={busy}
                      onClick={() => mutate(item, true)}
                    >Xóa</PcbButton>}
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
          label="vai trò"
        />
      </section>
      {selected ? <div>
        {!!detail.error && <IdentityState {...detail} count={1} />}
        <RoleMembers
          key={selected.id}
          role={detail.data || selected}
          refreshing={detail.loading || !!detail.error}
          onChanged={refresh}
        />
      </div> : <section className="identity-panel">
        <h2>Người dùng trong vai trò</h2>
        <p className="sep-muted">Chọn tên vai trò để xem, thêm hoặc thu hồi người dùng.</p>
      </section>}
    </div>
    {editor && <IdentityEditor
      kind="role"
      item={editor === 'new' ? undefined : editor}
      onClose={() => setEditor(null)}
      onConflict={refresh}
      onSaved={() => {
        setEditor(null);
        refresh();
        notice.success('Đã lưu vai trò.');
      }}
    />}
    {notice.dialog}
  </div>;
}

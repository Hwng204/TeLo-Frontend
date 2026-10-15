import { useState } from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Icon, PcbButton, SelectField } from '../../../components/pcb';
import { RowActionButton } from '../../../components/common/RowAction';
import { useAsync } from '../../../hooks/useAsync';
import { useBusy } from '../../../hooks/useBusy';
import { useDebounce } from '../../../hooks/useDebounce';
import { api } from '../../../services/api';
import type { RoleItem } from '../../../types';
import { identityError, roleScopeLabel } from '../../../utils/identity';
import { IdentityEditor } from '../components/IdentityEditor';
import { IdentityPager, IdentitySearch, IdentityState, IdentityStatusBadge } from '../components/IdentityUi';
import { RoleMembers } from '../components/RoleMembers';
import { useIdentityNotice } from '../components/useIdentityNotice';
import './identity.css';
import { requiredRolesApi } from '../requiredRolesApi';

export function RoleListPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState<RoleItem | null>(null);
  const selectedId = selected?.id ?? null;
  const [editor, setEditor] = useState<RoleItem | 'new' | null>(null);
  const debounced = useDebounce(search, 300);
  const result = useAsync(() => api.roles.list({
    search: debounced,
    status: status || undefined,
    page,
    pageSize
  }), [debounced, status, page, pageSize]);
  const detail = useAsync(() => selectedId ? api.roles.get(selectedId) : Promise.resolve(null), [selectedId]);
  const refresh = () => {
    result.reload();
    detail.reload();
  };
  const notice = useIdentityNotice();
  const requiredRoles = useAsync(requiredRolesApi.list, []);
  const missingRoles = requiredRoles.data?.filter(role => !role.exists) ?? [];
  const [busy, run] = useBusy();
  const mutate = (item: RoleItem, remove = false) => notice.confirm(remove ? `Bạn có chắc muốn xóa vai trò “${item.name}”? Vai trò này chưa phát sinh sử dụng. Thao tác xóa không thể hoàn tác.` : `${item.status === 'ACTIVE' ? 'Ngừng' : 'Bắt đầu'} áp dụng vai trò “${item.name}”? Phiên đăng nhập của người dùng liên quan sẽ cần đăng nhập lại.`, () => void run(async () => {
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
  }), remove ? 'Xóa vai trò' : item.status === 'ACTIVE' ? 'Ngừng áp dụng' : 'Kích hoạt', remove);
  return <div className="sep-page identity-page identity-role-page">
    <PageHeader title="Quản lý vai trò" inline />
    {missingRoles.length > 0 && <div className="sep-alert sep-alert--info" role="status">
      Chưa có đủ vai trò bắt buộc: {missingRoles.map(role => role.name).join(', ')}.
      <PcbButton variant="secondary" disabled={busy} onClick={() => notice.confirm('Bổ sung các vai trò hệ thống còn thiếu? Vai trò và người dùng hiện có được giữ nguyên.', () => void run(async () => {
        try { await requiredRolesApi.restore(); requiredRoles.reload(); refresh(); notice.success('Đã bổ sung các vai trò bắt buộc.'); }
        catch (error) { notice.error(identityError(error)); }
      }), 'Bổ sung vai trò')}>Bổ sung vai trò bắt buộc</PcbButton>
    </div>}
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
      <PcbButton disabled={busy} onClick={() => setEditor('new')}><Icon name="add" />Thêm vai trò</PcbButton>
    </div>
    <div className="identity-split">
      <section className="identity-panel" aria-label="Danh sách vai trò">
        <IdentityState {...result} count={result.data?.items.length ?? 0} />
        {!!result.data?.items.length && <div className="pcb-table-wrap">
          <table className="pcb-table identity-role-table">
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
                  {roleScopeLabel()}
                </td>
                <td>
                  <IdentityStatusBadge status={item.status} />
                </td>
                <td>
                  <div className="sep-row-actions">
                    <RowActionButton icon="visibility" label={`Xem người dùng trong vai trò ${item.name}`} onClick={() => setSelected(item)} />
                    <RowActionButton
                      icon="edit"
                      label={`Sửa vai trò ${item.name}`}
                      disabled={busy || result.loading}
                      onClick={() => setEditor(item)}
                    />
                    {!['ADMIN', 'OPERATIONALADMIN'].includes(item.code.toUpperCase()) && <RowActionButton
                      icon={item.status === 'ACTIVE' ? 'pause_circle' : 'play_circle'}
                      label={`${item.status === 'ACTIVE' ? 'Ngừng áp dụng' : 'Kích hoạt'} vai trò ${item.name}`}
                      disabled={busy || result.loading}
                      onClick={() => mutate(item)}
                    />}
                    <span className="identity-delete-action" title={!item.canDelete ? item.deleteBlockedReason || 'Vai trò hệ thống hoặc đã phát sinh sử dụng không thể xóa.' : undefined}>
                      <RowActionButton
                        icon="delete"
                        label={`Xóa vai trò ${item.name}`}
                        disabled={busy || result.loading || !item.canDelete}
                        onClick={() => mutate(item, true)}
                      />
                    </span>
                  </div>
                  {!item.canDelete && <p className="identity-delete-hint">{item.deleteBlockedReason || 'Vai trò hệ thống hoặc đã phát sinh sử dụng không thể xóa.'}</p>}
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
        <p className="sep-muted">Chưa chọn vai trò.</p>
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
        notice.success(editor === 'new' ? 'Đã thêm vai trò.' : 'Đã cập nhật vai trò.');
      }}
    />}
    {notice.dialog}
  </div>;
}

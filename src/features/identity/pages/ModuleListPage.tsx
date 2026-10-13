import { useState } from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Icon, PcbButton, SelectField } from '../../../components/pcb';
import { RowActionButton } from '../../../components/common/RowAction';
import { useAsync } from '../../../hooks/useAsync';
import { useBusy } from '../../../hooks/useBusy';
import { useDebounce } from '../../../hooks/useDebounce';
import { api } from '../../../services/api';
import type { ModuleItem } from '../../../types';
import { identityError } from '../../../utils/identity';
import { IdentityEditor } from '../components/IdentityEditor';
import { IdentityPager, IdentitySearch, IdentityState, IdentityStatusBadge } from '../components/IdentityUi';
import { useIdentityNotice } from '../components/useIdentityNotice';
import './identity.css';

export function ModuleListPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [editor, setEditor] = useState<ModuleItem | 'new' | null>(null);
  const debounced = useDebounce(search, 300);
  const result = useAsync(() => api.modules.list({
    search: debounced,
    status: status || undefined,
    page,
    pageSize
  }), [debounced, status, page, pageSize]);
  const notice = useIdentityNotice();
  const [busy, run] = useBusy();
  const actionsDisabled = busy || result.loading || !!result.error;
  const hasFilters = !!search.trim() || !!status;
  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setPage(1);
  };
  const mutate = (item: ModuleItem, remove = false) => notice.confirm(remove ? `Xóa module “${item.name}”? Thao tác này không thể hoàn tác.` : `${item.status === 'ACTIVE' ? 'Ngừng' : 'Bắt đầu'} áp dụng module “${item.name}”?`, () => void run(async () => {
    try {
      if (remove) await api.modules.remove(item.id, item.version);
      else await api.modules.status(item.id, item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE', item.version);
      if (remove && result.data?.items.length === 1 && page > 1) setPage(page - 1);
      result.reload();
      notice.success(remove ? 'Đã xóa module.' : 'Đã cập nhật trạng thái module.');
    } catch (error) {
      result.reload();
      notice.error(identityError(error));
    }
  }), remove ? 'Xóa module' : item.status === 'ACTIVE' ? 'Ngừng áp dụng' : 'Kích hoạt', remove);
  return <div className="sep-page identity-page identity-module-page">
    <div className="identity-module-heading">
      <PageHeader title="Quản lý module" inline />
      <PcbButton disabled={busy} onClick={() => setEditor('new')}><Icon name="add" />Thêm module</PcbButton>
    </div>
    <section className="identity-panel identity-module-panel" aria-label="Danh sách module" aria-busy={result.loading}>
      <div className="identity-module-toolbar">
      <IdentitySearch label="Tìm module" hideLabel placeholder="Tìm theo mã hoặc tên module…" value={search} onChange={value => {
        setSearch(value);
        setPage(1);
      }} />
      <SelectField
        label="Trạng thái"
        hideLabel
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
      {hasFilters && <RowActionButton icon="filter_alt_off" label="Bỏ bộ lọc" onClick={clearFilters} />}
      {result.data && <span className="identity-module-total" role="status">Tổng {result.data.totalCount} module</span>}
      </div>
      <div className="identity-module-feedback">
        <IdentityState {...result} loading={result.loading && !result.data?.items.length} count={result.data?.items.length ?? 0}
          columns={5}
          emptyTitle={hasFilters ? 'Không tìm thấy module' : 'Chưa có module'}
          emptyHint=""
          emptyAction={hasFilters
            ? <PcbButton variant="secondary" onClick={clearFilters}><Icon name="filter_alt_off" />Bỏ bộ lọc</PcbButton>
            : <PcbButton disabled={busy} onClick={() => setEditor('new')}><Icon name="add" />Thêm module</PcbButton>}
        />
      </div>
      {!!result.data?.items.length && <div className="pcb-table-wrap" tabIndex={0} role="region" aria-label="Bảng module">
        <table className="pcb-table identity-module-table" aria-label="Danh sách module">
          <thead><tr>
            <th scope="col">Module</th>
            <th scope="col">Mô tả</th>
            <th scope="col">Mục điều hướng</th>
            <th scope="col">Trạng thái</th>
            <th scope="col">Thao tác</th>
          </tr></thead>
          <tbody>{result.data.items.map(item => <tr key={item.id}>
            <td><strong className="identity-module-name">{item.name}</strong><code className="identity-module-code">{item.code}</code></td>
            <td><p className="identity-module-description" title={item.description || undefined}>{item.description || '—'}</p></td>
            <td><span className="identity-module-links"><Icon name="account_tree" size={18} />{item.navbarCount}</span></td>
            <td><IdentityStatusBadge status={item.status} /></td>
            <td><div className="sep-row-actions">
              <RowActionButton icon="edit" label={`Sửa module ${item.name}`} disabled={actionsDisabled} onClick={() => setEditor(item)} />
              <RowActionButton icon={item.status === 'ACTIVE' ? 'pause_circle' : 'play_circle'} label={`${item.status === 'ACTIVE' ? 'Ngừng áp dụng' : 'Kích hoạt'} module ${item.name}`} disabled={actionsDisabled} onClick={() => mutate(item)} />
              <span className="identity-delete-action" title={!item.canDelete ? 'Module đang có mục điều hướng liên kết.' : undefined}>
                <RowActionButton icon="delete" label={item.canDelete ? `Xóa module ${item.name}` : `Không thể xóa module ${item.name}: đang có mục điều hướng liên kết`} disabled={actionsDisabled || !item.canDelete} onClick={() => mutate(item, true)} />
              </span>
            </div></td>
          </tr>)}</tbody>
        </table>
      </div>}
      <div className="identity-module-footer">
        <IdentityPager
          data={result.data}
          page={page}
          pageSize={pageSize}
          setPage={setPage}
          setPageSize={setPageSize}
          label="module"
        />
      </div>
    </section>
    {editor && <IdentityEditor
      kind="module"
      item={editor === 'new' ? undefined : editor}
      onClose={() => setEditor(null)}
      onConflict={result.reload}
      onSaved={() => {
        setEditor(null);
        result.reload();
        notice.success(editor === 'new' ? 'Đã thêm module.' : 'Đã cập nhật module.');
      }}
    />}
    {notice.dialog}
  </div>;
}

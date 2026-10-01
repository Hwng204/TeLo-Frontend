import { useState } from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { PcbButton, SelectField } from '../../../components/pcb';
import { useAsync } from '../../../hooks/useAsync';
import { useBusy } from '../../../hooks/useBusy';
import { useDebounce } from '../../../hooks/useDebounce';
import { useNotice } from '../../../hooks/useNotice';
import { api } from '../../../services/api';
import type { ModuleItem } from '../../../types';
import { identityError } from '../../../utils/identity';
import { IdentityEditor } from '../components/IdentityEditor';
import { IdentityPager, IdentitySearch, IdentityState, IdentityStatusBadge } from '../components/IdentityUi';
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
  const notice = useNotice();
  const [busy, run] = useBusy();
  const mutate = (item: ModuleItem, remove = false) => notice.confirm(remove ? `Xóa module “${item.name}” chưa được sử dụng?` : `${item.status === 'ACTIVE' ? 'Ngừng' : 'Bắt đầu'} áp dụng module “${item.name}”?`, () => void run(async () => {
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
  }));
  return <div className="sep-page identity-page">
    <PageHeader title="Quản lý module" inline />
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
      <PcbButton disabled={busy} onClick={() => setEditor('new')}>Thêm module</PcbButton>
    </div>
    <section className="identity-panel" aria-label="Danh sách module">
      <IdentityState {...result} count={result.data?.items.length ?? 0} />
      {!!result.data?.items.length && <div className="identity-modules">
        {result.data.items.map(item => <article className="identity-panel identity-module" key={item.id}>
          <div>
            <h2>
              {item.name}
            </h2>
            <span className="sep-subline">
              {item.code}
            </span>
          </div>
          <IdentityStatusBadge status={item.status} />
          <p>
            {item.description || 'Chưa có mô tả.'}
          </p>
          <small className="sep-muted">{item.navbarCount} mục điều hướng liên kết</small>
          <div className="identity-actions">
            <PcbButton
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => setEditor(item)}
            >Chỉnh sửa</PcbButton>
            <PcbButton
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => mutate(item)}
            >
              {item.status === 'ACTIVE' ? 'Ngừng áp dụng' : 'Kích hoạt'}
            </PcbButton>
            {item.canDelete && <PcbButton
              variant="danger"
              size="sm"
              disabled={busy}
              onClick={() => mutate(item, true)}
            >Xóa</PcbButton>}
          </div>
        </article>)}
      </div>}
      <IdentityPager
        data={result.data}
        page={page}
        pageSize={pageSize}
        setPage={setPage}
        setPageSize={setPageSize}
        label="module"
      />
    </section>
    {editor && <IdentityEditor
      kind="module"
      item={editor === 'new' ? undefined : editor}
      onClose={() => setEditor(null)}
      onConflict={result.reload}
      onSaved={() => {
        setEditor(null);
        result.reload();
        notice.success('Đã lưu module.');
      }}
    />}
    {notice.dialog}
  </div>;
}

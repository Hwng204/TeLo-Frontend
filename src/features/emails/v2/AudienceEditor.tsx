import { useState } from 'react';
import { Field, Icon, PcbButton, RequiredLabel, SelectField } from '../../../components/pcb';
import { Pager } from '../../../components/common/Pager';
import { useAsync, useDebounce } from '../../../hooks';
import { notificationApi } from '../../../services/notificationApi';
import type { NotificationChannel, NotificationCounts, NotificationOption, NotificationPolicy } from '../../../types/notificationV2';
import { NotificationDialog, RequestState } from './NotificationUi';
import { policySelection } from './notificationForm';

export function Channels({ value, onChange, disabled = false }: { value: NotificationChannel[]; onChange: (value: NotificationChannel[]) => void; disabled?: boolean }) {
  return <fieldset className="nt-admin__channels" disabled={disabled}><legend><RequiredLabel required>Kênh thông báo</RequiredLabel></legend>{(['IN_APP', 'EMAIL'] as const).map(channel => <label key={channel} className={`nt-admin__channel${value.includes(channel) ? ' is-selected' : ''}`}>
    <input type="checkbox" checked={value.includes(channel)} onChange={event => onChange(event.target.checked ? [...value, channel] : value.filter(item => item !== channel))} />
    <Icon name={channel === 'IN_APP' ? 'notifications' : 'mail'} size={22} /><span><strong>{channel === 'IN_APP' ? 'Trong ứng dụng' : 'Gmail'}</strong><small>{channel === 'IN_APP' ? 'Hiển thị trong chuông của người nhận' : 'Gửi đến địa chỉ email đã có'}</small></span>
  </label>)}</fieldset>;
}

export function RecipientCounts({ counts }: { counts: NotificationCounts }) {
  return <div className="nt-admin__counts" aria-live="polite"><span><strong>{counts.userCount}</strong> người nhận</span><span><Icon name="notifications" size={17} /><strong>{counts.inAppCount}</strong> in-app</span><span><Icon name="mail" size={17} /><strong>{counts.emailCount}</strong> email</span>
    {counts.missingEmailCount > 0 && <span className="nt-admin__warning">{counts.missingEmailCount} chưa có email</span>}{counts.duplicateEmailCount > 0 && <span>{counts.duplicateEmailCount} địa chỉ trùng đã gộp</span>}</div>;
}

type PolicyKey = 'branchIds' | 'includeRoleIds' | 'includeUserIds' | 'excludeRoleIds' | 'excludeUserIds';
const kindFor = (key: PolicyKey) => key === 'branchIds' ? 'branches' : key.endsWith('RoleIds') ? 'roles' : 'users';
const titles: Record<PolicyKey, string> = { branchIds: 'Chọn phân hiệu trong trường', includeRoleIds: 'Thêm vai trò nhận thông báo', includeUserIds: 'Thêm cá nhân nhận thông báo', excludeRoleIds: 'Loại trừ vai trò', excludeUserIds: 'Loại trừ cá nhân' };

function AudiencePicker({ schoolId, policy, field, onChoose, onClose }: { schoolId: number; policy: NotificationPolicy; field: PolicyKey; onChoose: (ids: number[]) => void; onClose: () => void }) {
  const [selected, setSelected] = useState(policy[field]);
  const [search, setSearch] = useState('');
  const [branchId, setBranchId] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const keyword = useDebounce(search, 250);
  const kind = kindFor(field);
  const options = useAsync(() => notificationApi.options(schoolId, kind, { search: keyword, branchId: branchId ? Number(branchId) : undefined, branchIds: kind === 'users' ? policy.branchIds : undefined, page, pageSize }), [schoolId, kind, keyword, branchId, policy.branchIds, page, pageSize]);
  const branches = useAsync(() => kind === 'users' ? notificationApi.options(schoolId, 'branches', { ids: policy.branchIds, pageSize: 100 }) : Promise.resolve(null), [schoolId, kind, policy.branchIds]);
  const toggle = (item: NotificationOption) => setSelected(current => current.includes(item.id) ? current.filter(id => id !== item.id) : [...current, item.id]);
  return <NotificationDialog title={titles[field]} onClose={onClose}>
    <div className="nt-admin__dialog-body"><div className="nt-admin__filters"><Field type="search" leading="search" label="Tìm kiếm" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} />
      {kind === 'users' && <SelectField label="Lọc phân hiệu" value={branchId} onChange={event => { setBranchId(event.target.value); setPage(1); }}><option value="">Tất cả phân hiệu</option>{branches.data?.items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField>}</div>
      <RequestState {...options} empty={options.data?.items.length === 0} onRetry={options.reload} />
      <ul className="nt-admin__choices">{options.data?.items.map(item => <li key={item.id}><label><input type="checkbox" checked={selected.includes(item.id)} disabled={!selected.includes(item.id) && selected.length >= 200} onChange={() => toggle(item)} /><span><strong>{item.name}</strong><small>{[item.email || item.code, item.branchName].filter(Boolean).join(' · ')}</small></span></label></li>)}</ul>
      {options.data && <Pager page={page} pageSize={pageSize} totalCount={options.data.totalCount} itemLabel="lựa chọn" onChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1); }} />}
    </div><footer className="nt-admin__footer"><span>{selected.length} đã chọn qua các trang</span><PcbButton variant="secondary" onClick={onClose}>Hủy</PcbButton><PcbButton onClick={() => onChoose(selected)}>Áp dụng</PcbButton></footer>
  </NotificationDialog>;
}

function Selection({ schoolId, field, ids, onEdit, onRemove }: { schoolId: number; field: PolicyKey; ids: number[]; onEdit: () => void; onRemove: (id: number) => void }) {
  const data = useAsync(async () => {
    const batches = Array.from({ length: Math.ceil(ids.length / 100) }, (_, index) => ids.slice(index * 100, (index + 1) * 100));
    const results = await Promise.all(batches.map(batch => notificationApi.options(schoolId, kindFor(field), { ids: batch, pageSize: 100 })));
    return results.flatMap(result => result.items);
  }, [schoolId, field, ids]);
  return <div className="nt-admin__selection"><div className="nt-admin__chips">{ids.map(id => { const item = data.data?.find(option => option.id === id); return <span className={`nt-admin__chip${field.startsWith('exclude') ? ' nt-admin__chip--exclude' : ''}`} key={id}>{item?.name ?? (data.loading ? 'Đang tải tên…' : `#${id}`)}<button type="button" aria-label={`Bỏ ${item?.name ?? id}`} onClick={() => onRemove(id)}><Icon name="close" size={15} /></button></span>; })}</div><PcbButton variant="secondary" size="sm" onClick={onEdit}><Icon name="add" size={17} />{ids.length ? 'Chọn thêm / thay đổi' : 'Chọn'}</PcbButton></div>;
}

export function AudienceEditor({ schoolId, policy, channels, onChange, automatic = false }: { schoolId: number; policy: NotificationPolicy; channels: NotificationChannel[]; onChange: (policy: NotificationPolicy) => void; automatic?: boolean }) {
  const [picker, setPicker] = useState<PolicyKey | null>(null);
  const [preview, setPreview] = useState(false);
  const update = (key: PolicyKey, ids: number[]) => onChange(policySelection(policy, key, ids));
  return <section className="nt-admin__audience">
    <div className="nt-admin__section-heading"><div><h3>Phạm vi người nhận</h3><p>Các lựa chọn luôn thuộc trường đang quản lý. Loại trừ được ưu tiên.</p></div><PcbButton variant="secondary" size="sm" onClick={() => setPreview(true)}><Icon name="groups" size={18} />Kiểm tra danh sách</PcbButton></div>
    <div className="nt-admin__audience-group"><strong>Phân hiệu</strong><p>{policy.branchIds.length ? 'Chỉ người thuộc phân hiệu đã chọn' : 'Tất cả phân hiệu thuộc trường'}</p><Selection schoolId={schoolId} field="branchIds" ids={policy.branchIds} onEdit={() => setPicker('branchIds')} onRemove={id => update('branchIds', policy.branchIds.filter(item => item !== id))} /></div>
    {automatic && <label className="nt-admin__source-target"><input type="checkbox" checked={policy.includeSourceRecipients} onChange={event => onChange({ ...policy, includeSourceRecipients: event.target.checked })} /><span><strong>Người liên quan trực tiếp đến nghiệp vụ</strong><small>Người được giao, người cần review hoặc người giao theo từng sự kiện.</small></span></label>}
    <div className="nt-admin__audience-grid"><div className="nt-admin__audience-group"><strong>Vai trò nhận thông báo</strong><Selection schoolId={schoolId} field="includeRoleIds" ids={policy.includeRoleIds} onEdit={() => setPicker('includeRoleIds')} onRemove={id => update('includeRoleIds', policy.includeRoleIds.filter(item => item !== id))} /></div><div className="nt-admin__audience-group"><strong>Cá nhân bổ sung</strong><Selection schoolId={schoolId} field="includeUserIds" ids={policy.includeUserIds} onEdit={() => setPicker('includeUserIds')} onRemove={id => update('includeUserIds', policy.includeUserIds.filter(item => item !== id))} /></div></div>
    <details className="nt-admin__exclusions"><summary>Loại trừ người nhận <span>{policy.excludeRoleIds.length + policy.excludeUserIds.length} lựa chọn</span></summary><div className="nt-admin__audience-grid"><div><strong>Vai trò bị loại</strong><Selection schoolId={schoolId} field="excludeRoleIds" ids={policy.excludeRoleIds} onEdit={() => setPicker('excludeRoleIds')} onRemove={id => update('excludeRoleIds', policy.excludeRoleIds.filter(item => item !== id))} /></div><div><strong>Cá nhân bị loại</strong><Selection schoolId={schoolId} field="excludeUserIds" ids={policy.excludeUserIds} onEdit={() => setPicker('excludeUserIds')} onRemove={id => update('excludeUserIds', policy.excludeUserIds.filter(item => item !== id))} /></div></div>{automatic && <p className="nt-admin__warning">Loại trừ có thể khiến người được giao việc không nhận thông báo. Quyền và nhiệm vụ của họ vẫn giữ nguyên.</p>}</details>
    {picker && <AudiencePicker schoolId={schoolId} policy={policy} field={picker} onClose={() => setPicker(null)} onChoose={ids => { update(picker, ids); setPicker(null); }} />}
    {preview && <RecipientPreview schoolId={schoolId} policy={policy} channels={channels} automatic={automatic} onClose={() => setPreview(false)} />}
  </section>;
}

export function RecipientPreview({ schoolId, policy, channels, automatic = false, onClose }: { schoolId: number; policy: NotificationPolicy; channels: NotificationChannel[]; automatic?: boolean; onClose: () => void }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const data = useAsync(() => notificationApi.recipients(schoolId, policy, channels, { page, pageSize }), [schoolId, policy, channels, page, pageSize]);
  return <NotificationDialog title="Người nhận sau loại trừ và bỏ trùng" wide onClose={onClose}><div className="nt-admin__dialog-body">{automatic && policy.includeSourceRecipients && <p className="nt-admin__hint">Danh sách này chỉ tính phần nhóm và cá nhân bổ sung. Người liên quan nghiệp vụ được xác định khi sự kiện thật xảy ra.</p>}<RequestState {...data} onRetry={data.reload} />{data.data && <><RecipientCounts counts={data.data} /><div className="nt-admin__table-wrap"><table className="pcb-table"><thead><tr><th>Người nhận</th><th>Phân hiệu</th><th>Trong ứng dụng</th><th>Gmail</th></tr></thead><tbody>{data.data.recipients.items.map(item => <tr key={item.userId}><td><strong>{item.name}</strong><small>{item.email ?? 'Chưa có email'}</small></td><td>{item.branchName}</td><td>{item.receivesInApp ? 'Có' : 'Không chọn'}</td><td>{item.receivesEmail ? 'Đủ điều kiện' : item.emailSkipReason === 'NO_EMAIL' ? 'Chưa có email' : 'Không gửi'}</td></tr>)}</tbody></table></div><Pager page={page} pageSize={pageSize} totalCount={data.data.recipients.totalCount} itemLabel="người nhận" onChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1); }} /></>}</div><footer className="nt-admin__footer"><PcbButton variant="secondary" onClick={onClose}>Đóng</PcbButton></footer></NotificationDialog>;
}

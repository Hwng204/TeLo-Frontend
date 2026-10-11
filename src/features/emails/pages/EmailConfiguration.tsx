import { useEffect, useState } from 'react';
import { PcbButton, SelectField } from '../../../components/pcb';
import { useAsync, useBusy, useDebounce, useNotice } from '../../../hooks';
import { api } from '../../../services/api';
import type { EmailConfigItem, EmailEventItem, EmailTargetItem, SaveEmailConfigRequest } from '../../../types';
import { emailTargetKey, mergeEmailTargets } from '../../../utils/email';
import { problemLines, toProblem } from '../../../utils/problem';
import { EmailRecipientPicker } from '../components/EmailPickers';
import { EmailRevisionPicker } from '../components/EmailRevisionPicker';
import { EmailRecipientPreview } from '../components/EmailRecipientPreview';
import { EmailEventSelect, EmailPager, EmailSearch, EmailState } from '../components/EmailUi';

function ConfigurationForm({ schoolId, data, onSaved, onDirtyChange }: { schoolId: number; data: EmailConfigItem; onSaved: (saved: EmailConfigItem) => void; onDirtyChange: (dirty: boolean) => void }) {
  const [form, setForm] = useState<SaveEmailConfigRequest>({ ...data, emailTemplateVersionId: data.emailTemplateVersionId ?? 0 });
  const [revisionLabel, setRevisionLabel] = useState(data.emailTemplateVersionId ? `${data.templateName} · Phiên bản ${data.revision}` : 'Chưa chọn phiên bản');
  const dirty = JSON.stringify(form) !== JSON.stringify({ ...data, emailTemplateVersionId: data.emailTemplateVersionId ?? 0 });
  useEffect(() => { onDirtyChange(dirty); return () => onDirtyChange(false); }, [dirty, onDirtyChange]);
  const [revisionPicker, setRevisionPicker] = useState(false);
  const [targetPicker, setTargetPicker] = useState<{ kind: 'role' | 'user'; action: 'INCLUDE' | 'EXCLUDE' } | null>(null);
  const [preview, setPreview] = useState(false);
  const [failure, setFailure] = useState('');
  const [stale, setStale] = useState(false);
  const [busy, run] = useBusy();
  const notice = useNotice();
  const addTargets = (incoming: EmailTargetItem[]) => {
    const merged = mergeEmailTargets(form.targets, incoming);
    if (merged.length > 200) { notice.error('Cấu hình tối đa 200 lựa chọn vai trò hoặc người dùng.'); return; }
    setForm(current => ({ ...current, targets: merged })); setTargetPicker(null);
  };
  const validate = () => {
    if (!form.emailTemplateVersionId) return 'Chọn phiên bản mẫu email.';
    if (form.isActive && form.recipientScope === 'NONE' && !form.targets.some(target => target.action === 'INCLUDE')) return 'Chọn người nhận hoặc nhóm vai trò trước khi bật thông báo.';
    return '';
  };
  const save = () => {
    const error = validate(); setFailure(error);
    if (error || stale) return;
    void run(async () => {
      try { const saved = await api.email.saveConfiguration(schoolId, data.eventCode, form); onSaved(saved); }
      catch (error) { const problem = toProblem(error); setFailure(problemLines(problem).join(' ')); setStale(problem.code === 'STALE_VERSION'); }
    });
  };
  return <section className="email-panel email-form" aria-label="Cấu hình thông báo">
    {failure && <div className="sep-alert" role="alert">{failure}</div>}
    {stale && <p className="sep-alert sep-alert--info">Dữ liệu đã thay đổi. Tải lại cấu hình trước khi lưu.</p>}
    <fieldset disabled={busy || stale}>
      <label className="email-choice"><input type="checkbox" checked={form.isActive} onChange={event => setForm(current => ({ ...current, isActive: event.target.checked }))} /><span>Bật gửi email cho sự kiện</span></label>
      <div className="email-actions"><span>{revisionLabel}</span><PcbButton variant="secondary" onClick={() => setRevisionPicker(true)}>Chọn phiên bản mẫu</PcbButton></div>
      <SelectField label="Phạm vi người nhận" value={form.recipientScope} onChange={event => setForm(current => ({ ...current, recipientScope: event.target.value as 'NONE' | 'ALL_SCHOOL' }))}>
        <option value="NONE">Chỉ các nhóm và người được chọn</option><option value="ALL_SCHOOL">Tất cả người dùng đủ điều kiện trong trường</option>
      </SelectField>
      <div className="email-actions">
        <PcbButton variant="secondary" onClick={() => setTargetPicker({ kind: 'role', action: 'INCLUDE' })}>Thêm nhóm vai trò</PcbButton>
        <PcbButton variant="secondary" onClick={() => setTargetPicker({ kind: 'user', action: 'INCLUDE' })}>Thêm người nhận</PcbButton>
        <PcbButton variant="secondary" onClick={() => setTargetPicker({ kind: 'role', action: 'EXCLUDE' })}>Loại trừ nhóm</PcbButton>
        <PcbButton variant="secondary" onClick={() => setTargetPicker({ kind: 'user', action: 'EXCLUDE' })}>Loại trừ người nhận</PcbButton>
      </div>
      <ul className="email-options email-targets">{form.targets.map(target => <li key={emailTargetKey(target)}>
        <span><strong>{target.name || (target.roleId != null ? `Vai trò #${target.roleId}` : `Người dùng #${target.userId}`)}</strong><small>{target.action === 'INCLUDE' ? 'Nhận email' : 'Loại trừ khỏi danh sách nhận'} · {target.roleId != null ? 'Nhóm vai trò' : 'Người dùng'}</small></span>
        <PcbButton variant="danger" size="sm" onClick={() => setForm(current => ({ ...current, targets: current.targets.filter(item => emailTargetKey(item) !== emailTargetKey(target)) }))}>Bỏ chọn</PcbButton>
      </li>)}</ul>
      <p className="sep-muted">{form.targets.length}/200 lựa chọn. Người thuộc nhiều nhóm chỉ nhận một email; lựa chọn loại trừ được ưu tiên.</p>
    </fieldset>
    <div className="sep-actions"><PcbButton variant="secondary" disabled={busy || !form.emailTemplateVersionId} onClick={() => setPreview(true)}>Xem trước người nhận</PcbButton><PcbButton disabled={busy || stale} onClick={save}>{busy ? 'Đang lưu…' : 'Lưu cấu hình'}</PcbButton></div>
    {revisionPicker && <EmailRevisionPicker schoolId={schoolId} eventCode={data.eventCode} onClose={() => setRevisionPicker(false)} onChoose={(revision, template) => { setForm(current => ({ ...current, emailTemplateVersionId: revision.id })); setRevisionLabel(`${template.name} · Phiên bản ${revision.revision}`); setRevisionPicker(false); }} />}
    {targetPicker && <EmailRecipientPicker schoolId={schoolId} kind={targetPicker.kind} onClose={() => setTargetPicker(null)} onChoose={items => addTargets(items.map(item => ({ roleId: targetPicker.kind === 'role' ? item.id : null, userId: targetPicker.kind === 'user' ? item.id : null, action: targetPicker.action, name: item.name })))} />}
    {preview && <EmailRecipientPreview schoolId={schoolId} configuration={form} onClose={() => setPreview(false)} />}
    {notice.dialog}
  </section>;
}

function EventConfiguration({ schoolId, eventCode, onDirtyChange }: { schoolId: number; eventCode: string; onDirtyChange: (dirty: boolean) => void }) {
  const data = useAsync(() => api.email.configuration(schoolId, eventCode), [schoolId, eventCode]);
  const [saved, setSaved] = useState<EmailConfigItem | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const current = data.data ?? saved;
  const notice = useNotice();
  return <>
    <div className="email-actions"><PcbButton variant="secondary" onClick={() => notice.confirm('Tải lại cấu hình? Các thay đổi chưa lưu sẽ bị bỏ.', () => { setSaved(null); setReloadKey(key => key + 1); onDirtyChange(false); data.reload(); }, 'Tải lại')}>Tải lại cấu hình</PcbButton></div>
    {saved && !!data.error && <p className="sep-alert sep-alert--info">Đã lưu cấu hình, nhưng chưa tải lại được. Thông tin bên dưới là kết quả lưu đã được máy chủ xác nhận.</p>}
    <EmailState {...data} loading={data.loading && !saved} count={current ? 1 : 0} />
    {current && <><p className="sep-muted">{current.id ? 'Cấu hình đã lưu' : 'Sự kiện chưa được cấu hình'}</p><ConfigurationForm key={`${eventCode}:${current.version}:${reloadKey}`} schoolId={schoolId} data={current} onDirtyChange={onDirtyChange} onSaved={value => { setSaved(value); onDirtyChange(false); data.reload(); notice.success('Đã lưu cấu hình thông báo.'); }} /></>}
    {notice.dialog}
  </>;
}

export function EmailConfiguration({ schoolId, events, eventCode, onEventChange, onDirtyChange }: {
  schoolId: number; events: EmailEventItem[]; eventCode: string; onEventChange: (code: string) => void; onDirtyChange: (dirty: boolean) => void;
}) {
  return <>{!eventCode ? <ConfigurationList schoolId={schoolId} onChoose={onEventChange} /> : <div className="email-toolbar"><EmailEventSelect schoolId={schoolId} events={events} value={eventCode} all={false} onChange={onEventChange} /><PcbButton variant="secondary" onClick={() => onEventChange('')}>Danh sách cấu hình</PcbButton></div>}
    {eventCode && <EventConfiguration key={eventCode} schoolId={schoolId} eventCode={eventCode} onDirtyChange={onDirtyChange} />}
  </>;
}

function ConfigurationList({ schoolId, onChoose }: { schoolId: number; onChoose: (code: string) => void }) {
  const [search, setSearch] = useState('');
  const [state, setState] = useState('');
  const [trigger, setTrigger] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const keyword = useDebounce(search, 300);
  const list = useAsync(() => api.email.configurations(schoolId, { search: keyword, configurationState: state, triggerKind: trigger, page, pageSize }), [schoolId, keyword, state, trigger, page, pageSize]);
  const labels = { UNCONFIGURED: 'Chưa cấu hình', ENABLED: 'Đang bật', DISABLED: 'Đang tắt' };
  return <>
    <div className="email-toolbar">
      <EmailSearch value={search} onChange={value => { setSearch(value); setPage(1); }} />
      <SelectField label="Trạng thái cấu hình" value={state} onChange={e => { setState(e.target.value); setPage(1); }}><option value="">Tất cả</option>{Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</SelectField>
      <SelectField label="Loại sự kiện" value={trigger} onChange={e => { setTrigger(e.target.value); setPage(1); }}><option value="">Tất cả</option><option value="SYSTEM">Tự động từ nghiệp vụ</option><option value="MANUAL">Thủ công / đặt lịch</option></SelectField>
    </div>
    <section className="email-panel" aria-label="Danh sách cấu hình thông báo">
      <EmailState {...list} count={list.data?.items.length ?? 0} />
      {!!list.data?.items.length && <div className="pcb-table-wrap"><table className="pcb-table"><thead><tr><th>Sự kiện</th><th>Mẫu email</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>
        {list.data.items.map(item => <tr key={item.eventCode}>
          <td><strong>{item.eventName}</strong><div className="sep-subline">{item.eventCode} · {item.triggerKind === 'SYSTEM' ? 'Tự động' : 'Thủ công / đặt lịch'}</div></td>
          <td>{item.templateName ?? 'Chưa chọn mẫu'}{item.revision && <div className="sep-subline">Phiên bản {item.revision} · {item.targetCount} lựa chọn nhóm/cá nhân</div>}</td>
          <td><span className={`sep-status sep-status--${item.configurationState === 'ENABLED' ? 'green' : 'gray'}`}>{labels[item.configurationState]}</span>
            {item.eventStatus !== 'ACTIVE' && <div className="sep-subline">Sự kiện ngừng áp dụng</div>}
            {item.templateStatus === 'INACTIVE' && <div className="sep-subline">Mẫu ngừng áp dụng</div>}</td>
          <td><PcbButton variant="secondary" size="sm" onClick={() => onChoose(item.eventCode)}>{item.configId ? 'Chỉnh sửa' : 'Thiết lập'}</PcbButton></td>
        </tr>)}
      </tbody></table></div>}
      <EmailPager data={list.data} page={page} pageSize={pageSize} setPage={setPage} setPageSize={setPageSize} label="cấu hình" />
    </section>
  </>;
}

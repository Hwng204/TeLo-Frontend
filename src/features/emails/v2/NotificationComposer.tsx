import { useEffect, useState } from 'react';
import { Field, Icon, PcbButton, RequiredLabel } from '../../../components/pcb';
import { Pager } from '../../../components/common/Pager';
import { useAsync, useBusy, useDebounce, useNotice } from '../../../hooks';
import { notificationApi } from '../../../services/notificationApi';
import type { NotificationChannel, NotificationDispatch, NotificationEvent, NotificationPolicy, NotificationPreview, NotificationRuntime, NotificationSendRequest, NotificationTemplate } from '../../../types/notificationV2';
import { emailDateTime, emailScheduledUtc } from '../../../utils/email';
import { problemLines, toProblem } from '../../../utils/problem';
import { AudienceEditor, Channels, RecipientCounts } from './AudienceEditor';
import { MessagePreview, NotificationDialog, RequestState } from './NotificationUi';
import { emptyPolicy, manualNotificationVariables, missingNotificationValues } from './notificationForm';
import type { DirtyControl } from './NotificationTemplates';

function TemplatePicker({ schoolId, onChoose, onClose }: { schoolId: number; onChoose: (value: NotificationTemplate) => void; onClose: () => void }) {
  const [search, setSearch] = useState(''); const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(10);
  const keyword = useDebounce(search, 250);
  const data = useAsync(() => notificationApi.templates(schoolId, { search: keyword, eventCode: 'MANUAL', status: 'ACTIVE', page, pageSize }), [schoolId, keyword, page, pageSize]);
  return <NotificationDialog title="Chọn mẫu gửi thủ công" onClose={onClose}><div className="nt-admin__dialog-body"><Field label="Tìm mẫu" type="search" leading="search" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /><RequestState {...data} empty={data.data?.items.length === 0} onRetry={data.reload}><p>Tạo mẫu có sự kiện “Gửi thủ công” trong Mẫu nội dung trước.</p></RequestState><ul className="nt-admin__template-options">{data.data?.items.map(item => <li key={item.id}><div><strong>{item.name}</strong><small>{item.subjectTemplate}</small></div><PcbButton variant="secondary" size="sm" onClick={() => onChoose(item)}>Sử dụng</PcbButton></li>)}</ul>{data.data && <Pager page={page} pageSize={pageSize} totalCount={data.data.totalCount} itemLabel="mẫu" onChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1); }} />}</div><footer className="nt-admin__footer"><PcbButton variant="secondary" onClick={onClose}>Đóng</PcbButton></footer></NotificationDialog>;
}

export function NotificationComposer({ schoolId, events, runtime, onDirtyChange, request, onSent, onCreateTemplate }: { schoolId: number; events: NotificationEvent[]; runtime?: NotificationRuntime; onSent: (result: NotificationDispatch) => void; onCreateTemplate: () => void } & DirtyControl) {
  const [step, setStep] = useState(0); const [template, setTemplate] = useState<NotificationTemplate | null>(null); const [picker, setPicker] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({}); const [policy, setPolicy] = useState<NotificationPolicy>(emptyPolicy);
  const [channels, setChannels] = useState<NotificationChannel[]>(['IN_APP']); const [mode, setMode] = useState('now'); const [schedule, setSchedule] = useState('');
  const [preview, setPreview] = useState<{ request: NotificationSendRequest; message: NotificationPreview } | null>(null); const [busy, run] = useBusy(); const notice = useNotice();
  const dirty = !!template;
  useEffect(() => { onDirtyChange(dirty); return () => onDirtyChange(false); }, [dirty, onDirtyChange]);
  const event = events.find(item => item.code === template?.eventCode);
  const variables = manualNotificationVariables(event, template);
  const handleNext = (now: number) => {
    if (!template) { notice.error('Chọn mẫu thông báo trước khi tiếp tục.'); return; }
    const missing = missingNotificationValues(event ? { ...event, variables } : undefined, values);
    if (step === 0 && missing.length) { notice.error(`Nhập đủ thông tin: ${missing.join(', ')}.`); return; }
    if (step === 1 && !policy.includeRoleIds.length && !policy.includeUserIds.length) { notice.error('Chọn ít nhất một vai trò hoặc cá nhân nhận thông báo.'); return; }
    if (step < 2) { setStep(step + 1); return; }
    if (!channels.length) { notice.error('Chọn ít nhất một kênh thông báo.'); return; }
    if (channels.includes('EMAIL') && (!runtime?.emailEnabled || !runtime.smtpConfigured || !runtime.workerEnabled)) { notice.error('Gmail chưa sẵn sàng. Bạn có thể chọn kênh trong ứng dụng hoặc chờ quản trị máy chủ bật gửi email.'); return; }
    const scheduledFor = mode === 'schedule' ? emailScheduledUtc(schedule) : null;
    if (mode === 'schedule' && (!scheduledFor || Date.parse(scheduledFor) <= now)) { notice.error('Chọn thời gian gửi trong tương lai, theo giờ Việt Nam.'); return; }
    const body: NotificationSendRequest = { templateId: template.id, revision: template.revision, requestId: crypto.randomUUID(), values, recipientPolicy: { ...policy, includeSourceRecipients: false }, channels, scheduledFor };
    void run(async () => { try { const message = await notificationApi.preview(schoolId, body); setPreview({ request: { ...body, previewFingerprint: message.fingerprint, previewExpiresAt: message.expiresAt }, message }); setStep(3); } catch (error) { notice.error(problemLines(toProblem(error))); } });
  };
  const handleSend = () => {
    if (!preview || busy) return;
    if (Date.parse(preview.message.expiresAt) <= Date.now()) { notice.error('Bản xem trước đã hết hạn. Quay lại để kiểm tra người nhận và nội dung mới nhất.'); return; }
    void run(async () => { try { const result = await notificationApi.send(schoolId, preview.request); onDirtyChange(false); onSent(result); } catch (error) { notice.error(problemLines(toProblem(error))); } });
  };
  const choose = (item: NotificationTemplate) => { setTemplate(item); setValues({}); setPolicy({ ...item.recipientPolicy, includeSourceRecipients: false }); setChannels([...item.channels]); setPreview(null); setPicker(false); };
  const labels = ['Nội dung', 'Người nhận', 'Kênh & thời gian', 'Kiểm tra & gửi'];
  return <section className="nt-admin__compose"><div className="nt-admin__section-heading"><div><h2>Gửi thông báo</h2><p>Soạn một lần, gửi qua chuông ứng dụng và Gmail theo người nhận đã chọn.</p></div><PcbButton variant="secondary" onClick={onCreateTemplate}><Icon name="add" size={18} />Tạo mẫu</PcbButton></div>
    <ol className="nt-admin__stepper">{labels.map((label, index) => <li key={label} className={index === step ? 'is-current' : index < step ? 'is-complete' : ''}><span>{index < step ? <Icon name="check" size={18} /> : index + 1}</span><strong>{label}</strong></li>)}</ol>
    <div className="nt-admin__panel nt-admin__compose-body"><fieldset className="nt-admin__fieldset" disabled={busy}>
      {step === 0 && <><div className="nt-admin__section-heading"><div><h3>Mẫu nội dung <span className="nt-admin__required">*</span></h3><p>{template ? template.name : 'Chọn một mẫu đang áp dụng cho gửi thủ công.'}</p></div><PcbButton variant="secondary" onClick={() => setPicker(true)}><Icon name="description" size={18} />{template ? 'Đổi mẫu' : 'Chọn mẫu'}</PcbButton></div>{template && <div className="nt-admin__editor-grid"><div className="nt-admin__form-fields">{variables.length ? variables.map(variable => <label key={variable.name} className="nt-admin__textarea"><RequiredLabel required={variable.required}>{variable.label}</RequiredLabel><textarea rows={variable.name.toLowerCase().includes('content') || variable.name.toLowerCase().includes('body') ? 6 : 2} required={variable.required} value={values[variable.name] ?? ''} maxLength={2000} onChange={e => setValues(current => ({ ...current, [variable.name]: e.target.value }))} /></label>) : <p className="nt-admin__hint">Mẫu này không có thông tin cần nhập thêm. Nội dung sẽ được kiểm tra trước khi gửi.</p>}</div><MessagePreview subject={template.subjectTemplate} content={template.contentTemplate} /></div>}</>}
      {step === 1 && <><div className="nt-admin__section-heading"><div><h3>Ai sẽ nhận thông báo?</h3><p>Vai trò và cá nhân được cộng lại, sau đó bỏ trùng và loại trừ.</p></div><PcbButton size="sm" variant="ghost" onClick={() => template && setPolicy({ ...template.recipientPolicy, includeSourceRecipients: false })}>Khôi phục từ mẫu</PcbButton></div><AudienceEditor schoolId={schoolId} policy={policy} channels={channels} onChange={setPolicy} /></>}
      {step === 2 && <div className="nt-admin__form-fields"><Channels value={channels} onChange={setChannels} /><div className="nt-admin__schedule"><h3>Thời điểm phát thông báo</h3><div className="nt-admin__radio-options"><label><input type="radio" name="send-time" checked={mode === 'now'} onChange={() => setMode('now')} />Gửi ngay</label><label><input type="radio" name="send-time" checked={mode === 'schedule'} onChange={() => setMode('schedule')} />Đặt lịch một lần</label></div>{mode === 'schedule' && <Field label="Thời gian gửi (giờ Việt Nam UTC+7)" type="datetime-local" required value={schedule} onChange={e => setSchedule(e.target.value)} />}</div>{channels.includes('EMAIL') && <p className="nt-admin__hint">Người chưa có địa chỉ email vẫn nhận in-app nếu bạn chọn cả hai kênh. Gmail dùng tài khoản gửi chung của hệ thống.</p>}</div>}
      {step === 3 && preview && <><div className="nt-admin__section-heading"><div><h3>Kiểm tra trước khi gửi</h3><p>{preview.request.scheduledFor ? `Đặt lịch lúc ${emailDateTime(preview.request.scheduledFor)}` : 'Gửi ngay sau khi xác nhận'} · {template?.name}</p></div><span className="nt-admin__badge nt-admin__badge--blue">Chưa gửi</span></div><RecipientCounts counts={preview.message} /><div className="nt-admin__two-cols">{preview.message.channels.includes('EMAIL') && <MessagePreview subject={preview.message.subject} content={preview.message.content} />}{preview.message.channels.includes('IN_APP') && <MessagePreview channel="IN_APP" subject={preview.message.title} content={preview.message.content} inAppBody={preview.message.summary} />}</div>{preview.message.userCount === 0 && <p className="nt-admin__error" role="alert">Không có người nhận hợp lệ. Quay lại để điều chỉnh phạm vi.</p>}<p className="nt-admin__hint">Nội dung và danh sách này sẽ được lưu cho lần gửi. Email được xếp hàng; kết quả thật hiển thị trong Lịch sử gửi.</p></>}
    </fieldset></div><footer className="nt-admin__compose-footer"><span>Bước {step + 1} / 4</span><PcbButton variant="secondary" disabled={busy || step === 0} onClick={() => { setStep(step - 1); setPreview(null); }}><Icon name="chevron_left" size={18} />Quay lại</PcbButton>{step < 3 ? <PcbButton disabled={busy || !runtime?.schemaReady || !runtime.enabled} onClick={() => handleNext(Date.now())}>{busy ? 'Đang kiểm tra…' : step === 2 ? 'Xem trước & kiểm tra' : 'Tiếp tục'}<Icon name="chevron_right" size={18} /></PcbButton> : <PcbButton disabled={busy || !preview?.message.userCount || (!preview.message.inAppCount && !preview.message.emailCount)} onClick={handleSend}><Icon name={mode === 'schedule' ? 'schedule' : 'send'} size={18} />{busy ? 'Đang xử lý…' : mode === 'schedule' ? 'Xác nhận đặt lịch' : 'Xác nhận gửi'}</PcbButton>}</footer>
    {picker && <TemplatePicker schoolId={schoolId} onClose={() => setPicker(false)} onChoose={item => template ? request(() => choose(item)) : choose(item)} />}{notice.dialog}
  </section>;
}

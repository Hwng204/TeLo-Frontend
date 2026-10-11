import { useEffect, useState } from 'react';
import { Field, PcbButton, SelectField } from '../../../components/pcb';
import { useAsync, useBusy, useNotice } from '../../../hooks';
import { api } from '../../../services/api';
import type { EmailConfigItem, EmailEventItem, EmailMessagePreview, EmailRuntimeStatus, SendEmailRequest } from '../../../types';
import { emailDateTime, emailScheduledUtc } from '../../../utils/email';
import { problemLines, toProblem } from '../../../utils/problem';
import { EmailDialog, EmailEventSelect, EmailState } from '../components/EmailUi';

function SendForm({ schoolId, config, runtime, onDirtyChange, onQueued }: { schoolId: number; config: EmailConfigItem; runtime?: EmailRuntimeStatus; onDirtyChange: (dirty: boolean) => void; onQueued: () => void }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [mode, setMode] = useState('now'); const [schedule, setSchedule] = useState('');
  const [failure, setFailure] = useState(''); const [errors, setErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<{ request: SendEmailRequest; message: EmailMessagePreview } | null>(null);
  const [busy, run] = useBusy(); const notice = useNotice();
  const variables = config.variableDefinitions?.filter(v => !['schoolName', 'actorName', 'actionUrl'].includes(v.name)) ?? [];
  const dirty = Object.values(values).some(v => v !== '') || schedule !== '';
  useEffect(() => { onDirtyChange(dirty); return () => onDirtyChange(false); }, [dirty, onDirtyChange]);
  const handlePreview = () => {
    const scheduledFor = mode === 'schedule' ? emailScheduledUtc(schedule) : null;
    const validation: Record<string, string> = {};
    if (mode === 'schedule' && !scheduledFor) validation.scheduledFor = 'Chọn ngày và giờ hợp lệ. Lịch tương lai tối đa một năm được kiểm tra khi xem trước.';
    variables.forEach(v => { if (v.required && !values[v.name]?.trim()) validation[`values.${v.name}`] = `Nhập ${v.label}.`; });
    setErrors(validation); setFailure(''); if (Object.keys(validation).length) return;
    const request: SendEmailRequest = { eventCode: config.eventCode, configVersion: config.version, requestId: crypto.randomUUID(), values, scheduledFor };
    void run(async () => {
      try { const message = await api.email.previewMessage(schoolId, request); setPreview({ request: { ...request, previewFingerprint: message.fingerprint }, message }); }
      catch (error) { const problem = toProblem(error); setErrors(problem.fieldErrors ?? {}); setFailure(problemLines(problem).join(' ')); }
    });
  };
  const send = () => {
    if (!preview) return;
    void run(async () => {
      try { await api.email.send(schoolId, preview.request); onDirtyChange(false); onQueued(); }
      catch (error) { const problem = toProblem(error); if (problem.code === 'STALE_PREVIEW' || problem.code === 'STALE_VERSION') setPreview(null); notice.error(problemLines(problem)); }
    });
  };
  return <section className="email-panel email-form" aria-label="Soạn thông báo">
    {failure && <div className="sep-alert" role="alert">{failure}</div>}
    <p>{config.templateName} · Phiên bản {config.revision}</p>
    <fieldset disabled={busy}>
      {variables.map(v => <Field key={v.name} label={`${v.label}${v.required ? ' *' : ''}`} required={v.required}
        type={v.type === 'DATE' ? 'date' : v.type === 'NUMBER' ? 'number' : v.type === 'URL' ? 'url' : 'text'} maxLength={2000}
        value={values[v.name] ?? ''} error={errors[`values.${v.name}`]} onChange={e => setValues(current => ({ ...current, [v.name]: e.target.value }))} />)}
      <SelectField label="Thời điểm gửi" value={mode} onChange={e => setMode(e.target.value)}><option value="now">Gửi ngay</option><option value="schedule">Đặt lịch</option></SelectField>
      {mode === 'schedule' && <Field label="Lịch gửi · giờ Việt Nam (UTC+7) *" type="datetime-local" required value={schedule} error={errors.scheduledFor} onChange={e => setSchedule(e.target.value)} />}
    </fieldset>
    <div className="sep-actions"><PcbButton disabled={busy || !runtime?.enabled || !runtime.smtpConfigured} onClick={handlePreview}>{busy ? 'Đang kiểm tra…' : 'Xem trước và xác nhận'}</PcbButton></div>
    {preview && <EmailDialog title="Xác nhận gửi thông báo" busy={busy} onClose={() => setPreview(null)}>
      <h3>{preview.message.subject}</h3><pre className="email-content">{preview.message.body}</pre>
      <p>{preview.message.recipientCount} địa chỉ nhận · {preview.request.scheduledFor ? `Gửi lúc ${emailDateTime(preview.request.scheduledFor)}` : 'Gửi ngay'}</p>
      <div className="sep-actions"><PcbButton variant="secondary" disabled={busy} onClick={() => setPreview(null)}>Quay lại</PcbButton>
        <PcbButton disabled={busy || preview.message.recipientCount === 0} onClick={send}>{busy ? 'Đang xử lý…' : preview.request.scheduledFor ? 'Xác nhận đặt lịch' : 'Xác nhận gửi'}</PcbButton></div>
    </EmailDialog>}{notice.dialog}
  </section>;
}

export function EmailSend({ schoolId, events, eventCode, onEventChange, onConfigure, runtime, onDirtyChange, onQueued }: {
  schoolId: number; events: EmailEventItem[]; eventCode: string; onEventChange: (code: string) => void; onConfigure: () => void;
  runtime?: EmailRuntimeStatus; onDirtyChange: (dirty: boolean) => void; onQueued: () => void;
}) {
  const selected = useAsync(() => eventCode ? api.email.event(schoolId, eventCode) : Promise.resolve(null), [schoolId, eventCode]);
  const config = useAsync(() => eventCode ? api.email.configuration(schoolId, eventCode) : Promise.resolve(null), [schoolId, eventCode]);
  const notice = useNotice();
  const usable = selected.data?.triggerKind === 'MANUAL' && selected.data.status === 'ACTIVE';
  return <>
    <div className="email-toolbar"><EmailEventSelect schoolId={schoolId} events={events} value={eventCode} onChange={onEventChange} all={false} manualOnly />
      <PcbButton variant="secondary" onClick={() => notice.confirm('Tải lại cấu hình? Nội dung thông báo chưa gửi sẽ bị bỏ.', config.reload, 'Tải lại')}>Tải lại cấu hình</PcbButton></div>
    <EmailState {...selected} count={eventCode ? 1 : 0} />
    {eventCode && !selected.loading && !selected.error && !usable && <p className="sep-alert sep-alert--info">Chọn sự kiện thủ công đang áp dụng để gửi hoặc đặt lịch.</p>}
    {usable && <><EmailState {...config} count={config.data ? 1 : 0} />
      {config.data && (!config.data.isActive || !config.data.emailTemplateVersionId || config.data.templateStatus !== 'ACTIVE') &&
        <div className="email-panel"><p>Cần cấu hình mẫu email và người nhận trước khi gửi.</p><PcbButton variant="secondary" onClick={onConfigure}>Mở cấu hình</PcbButton></div>}
      {config.data?.isActive && config.data.templateStatus === 'ACTIVE' && <SendForm key={`${eventCode}:${config.data.version}`} schoolId={schoolId} config={config.data} runtime={runtime} onDirtyChange={onDirtyChange} onQueued={onQueued} />}
    </>}
    {notice.dialog}
  </>;
}

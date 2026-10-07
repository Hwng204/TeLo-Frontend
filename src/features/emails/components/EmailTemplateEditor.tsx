import { useState, type FormEvent } from 'react';
import { Field, PcbButton } from '../../../components/pcb';
import { useAsync, useBusy } from '../../../hooks';
import { api } from '../../../services/api';
import type { EmailEventItem, EmailTemplateDetail, SaveEmailTemplateRequest } from '../../../types';
import { previewEmailText, validateEmailTemplate } from '../../../utils/email';
import { toProblem, problemLines } from '../../../utils/problem';
import { EmailDialog, EmailEventSelect, EmailState } from './EmailUi';

function TemplateForm({ schoolId, events, detail, initialEventCode, busy, run, onSaved, onClose }: {
  schoolId: number; events: EmailEventItem[]; detail?: EmailTemplateDetail; initialEventCode: string; busy: boolean;
  run: (action: () => Promise<unknown>) => Promise<void>; onSaved: () => void; onClose: () => void;
}) {
  const [form, setForm] = useState<SaveEmailTemplateRequest>({
    code: detail?.template.code ?? '', name: detail?.template.name ?? '', eventCode: detail?.template.eventCode ?? initialEventCode,
    subject: detail?.currentRevision.subject ?? '', body: detail?.currentRevision.body ?? '', version: detail?.template.version ?? 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState('');
  const [stale, setStale] = useState(false);
  const [preview, setPreview] = useState(false);
  const selectedEvent = useAsync(() => form.eventCode ? api.email.event(schoolId, form.eventCode) : Promise.resolve(null), [schoolId, form.eventCode]);
  const variables = selectedEvent.data?.variables ?? [];
  const change = (field: keyof SaveEmailTemplateRequest, value: string) => setForm(current => ({ ...current, [field]: value }));
  const save = (event: FormEvent) => {
    event.preventDefault();
    const validation = validateEmailTemplate(form, selectedEvent.data ? [selectedEvent.data] : []);
    setErrors(validation); setFailure('');
    if (Object.keys(validation).length || stale) return;
    void run(async () => {
      try {
        const body = { ...form, code: form.code.trim(), name: form.name.trim(), subject: form.subject.trim() };
        if (detail) await api.email.updateTemplate(schoolId, detail.template.id, body);
        else await api.email.createTemplate(schoolId, body);
        onSaved();
      } catch (error) {
        const problem = toProblem(error);
        setErrors(problem.fieldErrors ?? {}); setFailure(problemLines(problem).join(' '));
        setStale(problem.code === 'STALE_VERSION');
      }
    });
  };
  return <form className="email-form" noValidate onSubmit={save}>
    {failure && <div className="sep-alert" role="alert">{failure}</div>}
    {stale && <p className="sep-alert sep-alert--info">Dữ liệu đã thay đổi. Đóng và mở lại biểu mẫu trước khi tiếp tục.</p>}
    <fieldset disabled={busy || stale}>
      <div className="email-fields">
        <Field label="Mã mẫu *" required value={form.code} maxLength={100} disabled={!!detail} error={errors.code} onChange={event => change('code', event.target.value)} />
        <Field label="Tên mẫu *" required value={form.name} maxLength={150} error={errors.name} onChange={event => change('name', event.target.value)} />
      </div>
      <EmailEventSelect schoolId={schoolId} events={events} value={form.eventCode} all={false} disabled={!!detail} onChange={value => change('eventCode', value)} />
      {errors.eventCode && <p className="pcb-error" role="alert">{errors.eventCode}</p>}
      <Field label="Tiêu đề email *" required value={form.subject} maxLength={200} error={errors.subject} onChange={event => change('subject', event.target.value)} />
      <label className="email-textarea">Nội dung email *
        <textarea rows={10} required value={form.body} maxLength={10000} aria-invalid={!!errors.body} onChange={event => change('body', event.target.value)} />
        <small>{form.body.length}/10.000 ký tự</small>
      </label>
      {errors.body && <p className="pcb-error" role="alert">{errors.body}</p>}
      <div><span className="pcb-label">Biến cho sự kiện</span>
        <div className="email-actions">{variables.length ? variables.map(variable => <PcbButton key={variable} variant="secondary" size="sm"
          onClick={() => change('body', `${form.body}{{${variable}}}`)} disabled={form.body.length + variable.length + 4 > 10000}>{`{{${variable}}}`}</PcbButton>) : <span className="sep-muted">Chọn sự kiện để xem các biến được phép.</span>}</div>
      </div>
    </fieldset>
    <div className="sep-actions"><PcbButton variant="ghost" disabled={busy} onClick={() => setPreview(true)}>Xem trước</PcbButton><PcbButton variant="secondary" disabled={busy} onClick={onClose}>Hủy</PcbButton><PcbButton type="submit" disabled={busy || stale || selectedEvent.loading}>{busy ? 'Đang lưu…' : 'Lưu mẫu'}</PcbButton></div>
    {preview && <EmailDialog title="Xem trước với giá trị minh họa" onClose={() => setPreview(false)}><h3>{previewEmailText(form.subject)}</h3><pre className="email-content">{previewEmailText(form.body)}</pre></EmailDialog>}
  </form>;
}

export function EmailTemplateEditor({ schoolId, templateId, events, initialEventCode = '', onClose, onSaved }: {
  schoolId: number; templateId?: number; events: EmailEventItem[]; initialEventCode?: string; onClose: () => void; onSaved: () => void;
}) {
  const detail = useAsync(() => templateId ? api.email.template(schoolId, templateId) : Promise.resolve(null), [schoolId, templateId]);
  const [busy, run] = useBusy();
  return <EmailDialog title={templateId ? 'Chỉnh sửa mẫu email' : 'Tạo mẫu email'} onClose={onClose} busy={busy}>
    <EmailState {...detail} count={detail.data || !templateId ? 1 : 0} />
    {!detail.loading && !detail.error && <TemplateForm schoolId={schoolId} events={events} initialEventCode={initialEventCode} detail={detail.data ?? undefined} busy={busy} run={run} onClose={onClose} onSaved={onSaved} />}
  </EmailDialog>;
}

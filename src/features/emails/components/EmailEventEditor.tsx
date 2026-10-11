import { useState, type FormEvent } from 'react';
import { Field, PcbButton, SelectField } from '../../../components/pcb';
import { useBusy, useNotice } from '../../../hooks';
import { api } from '../../../services/api';
import type { EmailEventItem, EmailEventVariable, SaveEmailEventRequest } from '../../../types';
import { validateEmailEvent } from '../../../utils/email';
import { problemLines, toProblem } from '../../../utils/problem';
import { EmailDialog } from './EmailUi';

export function EmailEventEditor({ schoolId, item, onClose, onSaved }: { schoolId: number; item?: EmailEventItem; onClose: () => void; onSaved: () => void }) {
  const initial: SaveEmailEventRequest = { code: item?.code ?? '', name: item?.name ?? '', description: item?.description ?? '', version: item?.version ?? 0,
    variableDefinitions: item?.variableDefinitions?.filter(v => !['schoolName', 'actorName', 'actionUrl'].includes(v.name)) ?? [] };
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState('');
  const [stale, setStale] = useState(false);
  const [busy, run] = useBusy();
  const notice = useNotice();
  const close = () => JSON.stringify(form) !== JSON.stringify(initial) ? notice.confirm('Bỏ các thay đổi chưa lưu?', onClose, 'Bỏ thay đổi') : onClose();
  const variable = (index: number, value: Partial<EmailEventVariable>) => setForm(current => ({ ...current,
    variableDefinitions: current.variableDefinitions.map((v, i) => i === index ? { ...v, ...value } : v) }));
  const save = (event: FormEvent) => {
    event.preventDefault(); const validation = validateEmailEvent(form); setErrors(validation); setFailure('');
    if (Object.keys(validation).length || stale) return;
    void run(async () => {
      try {
        if (item) await api.email.updateEvent(schoolId, item.code, form); else await api.email.createEvent(schoolId, form);
        onSaved();
      } catch (error) { const problem = toProblem(error); setFailure(problemLines(problem).join(' ')); setErrors(problem.fieldErrors ?? {}); setStale(problem.code === 'STALE_VERSION'); }
    });
  };
  return <EmailDialog title={item ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện'} busy={busy} onClose={close}>
    <form className="email-form" noValidate onSubmit={save}>
      {failure && <div className="sep-alert" role="alert">{failure}</div>}
      <fieldset disabled={busy || stale}>
        <div className="email-fields"><Field label="Mã sự kiện *" required disabled={!!item} value={form.code} maxLength={94} error={errors.code} onChange={e => setForm(current => ({ ...current, code: e.target.value }))} />
          <Field label="Tên sự kiện *" required value={form.name} maxLength={150} error={errors.name} onChange={e => setForm(current => ({ ...current, name: e.target.value }))} /></div>
        <label className="email-textarea">Mô tả<textarea rows={3} maxLength={1000} value={form.description} onChange={e => setForm(current => ({ ...current, description: e.target.value }))} /></label>
        <p className="sep-muted">Sự kiện này dùng để gửi thủ công hoặc đặt lịch. Biến có sẵn: {'{{schoolName}}, {{actorName}}, {{actionUrl}}'}.</p>
        <div className="email-actions"><h3>Biến nội dung</h3><PcbButton variant="secondary" disabled={form.variableDefinitions.length >= 20}
          onClick={() => setForm(current => ({ ...current, variableDefinitions: [...current.variableDefinitions, { name: '', label: '', type: 'TEXT', required: true }] }))}>Thêm biến</PcbButton></div>
        {errors.variableDefinitions && <div className="pcb-error" role="alert">{errors.variableDefinitions}</div>}
        {form.variableDefinitions.map((v, index) => <section className="email-panel email-form" key={index} aria-label={`Biến ${index + 1}`}>
          <div className="email-fields"><Field label="Tên biến *" value={v.name} maxLength={32} onChange={e => variable(index, { name: e.target.value })} />
            <Field label="Nhãn hiển thị *" value={v.label} maxLength={150} onChange={e => variable(index, { label: e.target.value })} />
            <SelectField label="Kiểu dữ liệu" value={v.type} onChange={e => variable(index, { type: e.target.value as EmailEventVariable['type'] })}>
              <option value="TEXT">Văn bản</option><option value="DATE">Ngày</option><option value="NUMBER">Số</option><option value="URL">Liên kết</option></SelectField>
            <label className="email-choice"><input type="checkbox" checked={v.required} onChange={e => variable(index, { required: e.target.checked })} />Bắt buộc nhập</label></div>
          <PcbButton variant="danger" size="sm" onClick={() => setForm(current => ({ ...current, variableDefinitions: current.variableDefinitions.filter((_, i) => i !== index) }))}>Bỏ biến</PcbButton>
        </section>)}
      </fieldset>
      <div className="sep-actions"><PcbButton variant="secondary" disabled={busy} onClick={close}>Hủy</PcbButton><PcbButton type="submit" disabled={busy || stale}>{busy ? 'Đang lưu…' : 'Lưu sự kiện'}</PcbButton></div>
    </form>{notice.dialog}
  </EmailDialog>;
}

import { useState, type FormEvent } from 'react';
import { Field, Icon, PcbButton } from '../../../components/pcb';
import { useBusy } from '../../../hooks/useBusy';
import { api } from '../../../services/api';
import type { ModuleItem, RoleItem } from '../../../types';
import { identityConflict, identityError, validateModule, validateRole } from '../../../utils/identity';
import { IdentityDialog } from './IdentityUi';
import type { ScopeValue } from './ScopeFields';
import { displayToast } from '../../../utils/toast';

export function IdentityEditor({ kind, item, onClose, onSaved, onConflict }: {
  kind: 'role' | 'module';
  item?: RoleItem | ModuleItem;
  initialScope?: ScopeValue;
  onClose: () => void;
  onSaved: () => void;
  onConflict: () => void
}) {
  const [code, setCode] = useState(item?.code ?? '');
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stale, setStale] = useState(false);
  const [busy, run] = useBusy();
  const label = kind === 'role' ? 'vai trò' : 'module';
  const save = (event: FormEvent) => {
    event.preventDefault();
    const body = {
      code: code.trim(),
      name: name.trim(),
      description: description.trim() || null,
      schoolId: null,
      schoolBranchId: null
    };
    const nextErrors = kind === 'role' ? validateRole(body) : validateModule(body);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    void run(async () => {
      try {
        if (kind === 'role') {
          if (item) {
            await api.roles.update(item.id, { ...body, version: item.version });
          } else {
            await api.roles.create(body);
          }
        } else {
          if (item) {
            await api.modules.update(item.id, { ...body, version: item.version });
          } else {
            await api.modules.create(body);
          }
        }
        onSaved();
      } catch (error) {
        displayToast('error', 'Lỗi', identityError(error), 5);
        if (identityConflict(error)) {
          setStale(true);
          onConflict();
        }
      }
    });
  };
  return <IdentityDialog
    title={`${item ? 'Chỉnh sửa' : 'Thêm'} ${label}`}
    busy={busy}
    onClose={onClose}
    icon={kind === 'role' ? 'shield' : 'widgets'}
    className={`identity-dialog--${kind}`}
  >
    <form
      onSubmit={save}
      noValidate
      className="identity-form"
    >
      {stale && <p className="sep-alert sep-alert--info">Đóng biểu mẫu và mở lại để lấy dữ liệu mới nhất trước khi tiếp tục.</p>}
      <fieldset disabled={busy || stale}>
        <div className="identity-form-grid">
        {kind === 'role' && <Field
          label={`Mã ${label}`}
          required
          value={code}
          maxLength={50}
          disabled={!!item}
          onChange={event => setCode(event.target.value)}
          error={errors.code}
          aria-invalid={!!errors.code}
        />}
        <Field
          label={`Tên ${label}`}
          required
          value={name}
          maxLength={150}
          placeholder={kind === 'module' ? 'Ví dụ: Thi, Quản lý học tập' : undefined}
          onChange={event => setName(event.target.value)}
          error={errors.name}
          aria-invalid={!!errors.name}
        />
        </div>
        {kind === 'module' && <label className="identity-description">Mô tả<textarea
          value={description}
          maxLength={500}
          rows={3}
          onChange={event => setDescription(event.target.value)}
          aria-invalid={!!errors.description}
        /><small>{description.length}/500 ký tự</small></label>}
        {errors.description && <p role="alert" className="pcb-error">
          {errors.description}
        </p>}
        {kind === 'role' && <p className="sep-muted">Vai trò áp dụng cho toàn hệ thống.</p>}
        {kind === 'module' && <p className="sep-muted">Mô tả phạm vi của phân hệ. Ví dụ, module Thi bao gồm ma trận, ngân hàng câu hỏi, bộ đề và tổ chức kỳ thi.</p>}
        {errors.scope && <p role="alert" className="pcb-error">
          {errors.scope}
        </p>}
      </fieldset>
      <div className="sep-actions">
        <PcbButton
          variant="secondary"
          onClick={onClose}
          disabled={busy}
        ><Icon name="close" />Hủy</PcbButton>
        <PcbButton type="submit" disabled={busy || stale}>
          <Icon name="save" />{busy ? 'Đang lưu…' : `Lưu ${label}`}
        </PcbButton>
      </div>
    </form>
  </IdentityDialog>;
}

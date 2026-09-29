import { useEffect, useRef, useState } from 'react';
import { Field, PcbButton, SelectField } from '../../../components/pcb';
import { useAsync, useBusy, useNotice } from '../../../hooks';
import { api } from '../../../services/api';
import type { StudentCurrentClass } from '../../../types';
import { problemLines, toProblem } from '../../../utils/problem';

type Props = {
  open: boolean;
  schoolId: number;
  studentId: number;
  studentName: string;
  current: StudentCurrentClass;
  onClose: () => void;
  /** Gọi sau khi chuyển thành công, để màn chi tiết tải lại lớp hiện tại và lịch sử. */
  onDone: (className: string) => void;
};

/**
 * Admin chuyển học sinh sang lớp khác trong CÙNG năm học; lớp cũ vẫn nằm trong lịch sử.
 * Figma chưa có màn này; backend: POST /admin/schools/{id}/students/{id}/transfer-class.
 */
export const TransferClassDialog = ({ open, schoolId, studentId, studentName, current, onClose, onDone }: Props) => {
  const ref = useRef<HTMLDialogElement>(null);
  const [classId, setClassId] = useState('');
  const [effectiveOn, setEffectiveOn] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const popup = useNotice();
  const [busy, runExclusive] = useBusy();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const sameYear = useAsync(
    async () => (open ? api.directory.referenceData(current.academicYearId, schoolId) : null),
    [open, current.academicYearId, schoolId],
  );
  const targets = (sameYear.data?.classes ?? []).filter((item) => item.id !== current.classId);

  const submit = () => {
    if (!classId) {
      setErrors({ schoolClassId: 'Chọn lớp chuyển đến.' });
      popup.error(targets.length === 0 ? 'Năm học này chưa có lớp nào khác để chuyển.' : 'Chọn lớp chuyển đến.');
      return;
    }
    void runExclusive(async () => {
      try {
        await api.directory.transferStudent(schoolId, studentId, {
          schoolClassId: Number(classId),
          effectiveOn: effectiveOn || null,
        });
        onDone(targets.find((item) => String(item.id) === classId)?.name ?? '');
      } catch (error) {
        const parsed = toProblem(error);
        popup.error(problemLines(parsed));
        setErrors(parsed.fieldErrors ?? {});
      }
    });
  };

  return (
    <>
    <dialog ref={ref} className="sep-dialog" onCancel={onClose} onClose={onClose}>
      <div className="sep-dialog__body">
        <h2 className="sep-dialog__title">Chuyển lớp</h2>
        <p className="sep-muted">
          {studentName} · lớp {current.className} ({current.academicYearName})
        </p>
        <SelectField
          label="Lớp chuyển đến"
          value={classId}
          invalid={Boolean(errors.schoolClassId)}
          onChange={(event) => {
            setClassId(event.target.value);
            setErrors({});
          }}
        >
          <option value="">Chọn lớp</option>
          {targets.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </SelectField>
        <Field
          label="Ngày chuyển"
          type="date"
          value={effectiveOn}
          invalid={Boolean(errors.effectiveOn)}
          onChange={(event) => setEffectiveOn(event.target.value)}
        />
        <div className="sep-actions">
          <PcbButton variant="ghost" onClick={onClose}>
            Huỷ
          </PcbButton>
          <PcbButton disabled={busy} onClick={submit}>
            {busy ? 'Đang chuyển…' : 'Chuyển lớp'}
          </PcbButton>
        </div>
      </div>
    </dialog>
    {popup.dialog}
    </>
  );
};

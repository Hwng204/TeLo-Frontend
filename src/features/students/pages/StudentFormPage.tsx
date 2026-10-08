import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Field, PcbButton, SelectField } from '../../../components/pcb';
import { PageHeader } from '../../../components/common/PageHeader';
import { useAsync, useBusy, useDirectoryScope, useNotice } from '../../../hooks';
import { api } from '../../../services/api';
import type { SaveStudentRequest, StudentStatus } from '../../../types';
import { liveClass, STUDENT_STATUS } from '../../../utils/directory';
import { problemLines, toProblem } from '../../../utils/problem';

type Draft = {
  code: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  status: StudentStatus;
  schoolClassId: string;
};

const EMPTY: Draft = { code: '', fullName: '', dateOfBirth: '', gender: '', status: 'ACTIVE', schoolClassId: '' };
// "Đã xoá" chỉ đạt được bằng nút Xoá; hồ sơ đã xoá thì giữ lựa chọn đó, chọn trạng thái khác là khôi phục.
const EDITABLE_STATUSES: StudentStatus[] = ['ACTIVE', 'TEMPORARY_LEAVE', 'TRANSFERRED'];

/** Admin: thêm học sinh (/students/new, kèm lớp ghi danh đầu tiên) hoặc sửa hồ sơ (/students/:id/edit). */
export const StudentFormPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const studentId = params.id ? Number(params.id) : null;
  const scope = useDirectoryScope();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const popup = useNotice();
  const [busy, runExclusive] = useBusy();

  const reference = useAsync(
    async () => (scope.schoolId ? api.directory.referenceData(undefined, scope.schoolId) : null),
    [scope.schoolId],
  );
  const existing = useAsync(
    async () => (studentId && scope.schoolId ? api.directory.studentDetail(studentId, scope.schoolId) : null),
    [studentId, scope.schoolId],
  );

  const current = existing.data;
  const studying = current ? liveClass(current) : null;
  const value: Draft =
    draft ??
    (current
      ? {
          code: current.code,
          fullName: current.fullName,
          dateOfBirth: current.dateOfBirth ?? '',
          gender: current.gender ?? '',
          status: current.status,
          schoolClassId: '',
        }
      : EMPTY);
  const set = (key: keyof Draft, next: string) => {
    setDraft({ ...value, [key]: next });
    setErrors((old) => ({ ...old, [key]: '' }));
  };

  const back = () => scope.back(studentId ? `/students/${studentId}` : '/students');

  const submit = () => {
    const found: Record<string, string> = {};
    if (!value.code.trim()) found.code = 'Nhập mã học sinh.';
    else if (value.code.trim().length > 64) found.code = 'Mã học sinh tối đa 64 ký tự.';
    if (!value.fullName.trim()) found.fullName = 'Nhập họ và tên.';
    else if (value.fullName.trim().length > 255) found.fullName = 'Họ và tên tối đa 255 ký tự.';
    if (!studentId && !value.schoolClassId) found.schoolClassId = 'Chọn lớp cho học sinh.';
    setErrors(found);
    if (Object.keys(found).length > 0) {
      popup.error(Object.values(found));
      return;
    }

    const body: SaveStudentRequest = {
      code: value.code.trim(),
      fullName: value.fullName.trim(),
      dateOfBirth: value.dateOfBirth || null,
      gender: value.gender || null,
      status: value.status,
      schoolClassId: value.schoolClassId ? Number(value.schoolClassId) : null,
    };
    void runExclusive(async () => {
      try {
        const saved = studentId
          ? await api.directory.updateStudent(scope.schoolId!, studentId, body)
          : await api.directory.createStudent(scope.schoolId!, body);
        if (studentId && scope.canGoBack) navigate(-1);
        else navigate(scope.withSchool(`/students/${saved.id}`), { replace: true });
      } catch (error) {
        const parsed = toProblem(error);
        popup.error(problemLines(parsed));
        setErrors({ ...(parsed.fieldErrors ?? {}), ...(parsed.code === 'STUDENT_CODE_DUPLICATE' ? { code: parsed.message } : {}) });
      }
    });
  };

  const loadError = reference.error ?? existing.error ?? scope.schoolsError;

  return (
    <>
      <PageHeader title={studentId ? 'Sửa hồ sơ học sinh' : 'Thêm học sinh'} onBack={back} inline={scope.admin} />

      <div className={scope.admin ? 'sep-page sep-page--flush' : 'sep-page'}>
        {loadError != null && <div className="sep-alert" role="alert">{toProblem(loadError).message}</div>}

        <section className="sep-section">
          <h2 className="sep-section-title">Hồ sơ học sinh</h2>
          <div className="sep-fields">
            <Field label="Mã học sinh" value={value.code} invalid={Boolean(errors.code)} onChange={(e) => set('code', e.target.value)} />
            <Field label="Họ và tên" value={value.fullName} invalid={Boolean(errors.fullName)} onChange={(e) => set('fullName', e.target.value)} />
            <Field label="Ngày sinh" type="date" value={value.dateOfBirth} invalid={Boolean(errors.dateOfBirth)} onChange={(e) => set('dateOfBirth', e.target.value)} />
            <SelectField label="Giới tính" value={value.gender} invalid={Boolean(errors.gender)} onChange={(e) => set('gender', e.target.value)}>
              <option value="">Chưa rõ</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
            </SelectField>
          </div>
        </section>

        <section className="sep-section">
          <h2 className="sep-section-title">Học tập</h2>
          <div className="sep-fields">
            <SelectField label="Trạng thái học tập" value={value.status} invalid={Boolean(errors.status)} onChange={(e) => set('status', e.target.value)}>
              {(current?.status === 'INACTIVE' ? [...EDITABLE_STATUSES, 'INACTIVE' as const] : EDITABLE_STATUSES).map((code) => (
                <option key={code} value={code}>
                  {STUDENT_STATUS[code].label}
                </option>
              ))}
            </SelectField>
            {studying ? (
              <Field label="Lớp hiện tại" value={studying.className} readOnly fieldClassName="sep-span-2" />
            ) : (
              <SelectField
                label="Lớp"
                value={value.schoolClassId}
                invalid={Boolean(errors.schoolClassId)}
                fieldClassName="sep-span-2"
                onChange={(e) => set('schoolClassId', e.target.value)}
              >
                <option value="">Chọn lớp</option>
                {reference.data?.classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </SelectField>
            )}
          </div>
        </section>

        <div className="sep-actions">
          <PcbButton variant="ghost" onClick={back}>
            Huỷ
          </PcbButton>
          <PcbButton disabled={busy || !scope.schoolId || (studentId !== null && !current)} onClick={submit}>
            {studentId ? 'Lưu thay đổi' : 'Thêm học sinh'}
          </PcbButton>
        </div>
      </div>
      {popup.dialog}
    </>
  );
};

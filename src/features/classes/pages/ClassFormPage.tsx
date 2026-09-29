import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Field, PcbButton, SelectField } from '../../../components/pcb';
import { PageHeader } from '../../../components/common/PageHeader';
import { useAsync, useBusy, useDirectoryScope, useNotice } from '../../../hooks';
import { api } from '../../../services/api';
import type { ClassStatus, SaveClassRequest } from '../../../types';
import { CLASS_STATUS } from '../../../utils/directory';
import { problemLines, toProblem } from '../../../utils/problem';

type Draft = {
  schoolBranchId: string;
  name: string;
  academicYearId: string;
  gradeLevelId: string;
  status: ClassStatus;
  homeroomTeacherId: string;
};

const EMPTY: Draft = { schoolBranchId: '', name: '', academicYearId: '', gradeLevelId: '', status: 'ACTIVE', homeroomTeacherId: '' };

/** Admin: thêm lớp (/classes/new) hoặc sửa lớp (/classes/:id/edit) của trường đang chọn. */
export const ClassFormPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const classId = params.id ? Number(params.id) : null;
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
    async () => (classId && scope.schoolId ? api.directory.classDetail(classId, { page: 1, pageSize: 1 }, scope.schoolId) : null),
    [classId, scope.schoolId],
  );

  // Chưa chạm vào thì lấy giá trị đang có (sửa) hoặc mặc định (thêm); chạm rồi thì giữ bản của người dùng.
  const current = existing.data?.class;
  const value: Draft =
    draft ??
    (current
      ? {
          schoolBranchId: String(current.schoolBranchId),
          name: current.name,
          academicYearId: String(current.academicYearId),
          gradeLevelId: String(current.gradeLevelId),
          status: current.status,
          homeroomTeacherId: current.homeroomTeacherId ? String(current.homeroomTeacherId) : '',
        }
      : EMPTY);
  const set = (key: keyof Draft, next: string) => {
    setDraft({ ...value, [key]: next, ...(key === 'schoolBranchId' ? { homeroomTeacherId: '' } : {}) });
    setErrors((old) => ({ ...old, [key]: '' }));
  };

  const teachers = useAsync(
    async () => (scope.schoolId && value.schoolBranchId ? api.directory.teachers(scope.schoolId, Number(value.schoolBranchId)) : null),
    [scope.schoolId, value.schoolBranchId],
  );

  const back = () => scope.back(classId ? `/classes/${classId}` : '/classes');
  const title = classId ? 'Sửa lớp' : 'Thêm lớp';

  const submit = () => {
    // Ô sai chỉ viền đỏ; nội dung lỗi hiện trong popup.
    const found: Record<string, string> = {};
    if (!value.schoolBranchId) found.schoolBranchId = 'Chọn cơ sở.';
    if (!value.name.trim()) found.name = 'Nhập tên lớp.';
    else if (value.name.trim().length > 100) found.name = 'Tên lớp tối đa 100 ký tự.';
    if (!value.academicYearId) found.academicYearId = 'Chọn năm học.';
    if (!value.gradeLevelId) found.gradeLevelId = 'Chọn khối.';
    setErrors(found);
    if (Object.keys(found).length > 0) {
      popup.error(Object.values(found));
      return;
    }

    const body: SaveClassRequest = {
      schoolBranchId: Number(value.schoolBranchId),
      name: value.name.trim(),
      academicYearId: Number(value.academicYearId),
      gradeLevelId: Number(value.gradeLevelId),
      status: value.status,
      homeroomTeacherId: value.homeroomTeacherId ? Number(value.homeroomTeacherId) : null,
    };
    void runExclusive(async () => {
      try {
        const saved = classId
          ? await api.directory.updateClass(scope.schoolId!, classId, body)
          : await api.directory.createClass(scope.schoolId!, body);
        // Sửa xong thì lùi về màn chi tiết vừa mở (nó tự tải lại); thêm mới thì thay form bằng màn chi tiết.
        if (classId && scope.canGoBack) navigate(-1);
        else navigate(scope.withSchool(`/classes/${saved.class.id}`), { replace: true });
      } catch (error) {
        const parsed = toProblem(error);
        popup.error(problemLines(parsed));
        // Đánh dấu đúng ô: tên trùng, giáo viên đã chủ nhiệm lớp khác, hoặc ô backend nêu trong fieldErrors.
        const field = parsed.code === 'CLASS_CODE_DUPLICATE' ? 'name' : parsed.code === 'TEACHER_ALREADY_HOMEROOM' ? 'homeroomTeacherId' : null;
        setErrors({ ...(parsed.fieldErrors ?? {}), ...(field ? { [field]: parsed.message } : {}) });
      }
    });
  };

  const loadError = reference.error ?? existing.error ?? scope.schoolsError;
  const layoutClass = scope.admin ? 'sep-page sep-page--flush' : 'sep-page';

  return (
    <>
      <PageHeader title={title} onBack={back} inline={scope.admin} />

      <div className={layoutClass}>
        {loadError != null && <div className="sep-alert" role="alert">{toProblem(loadError).message}</div>}

        <section className="sep-section">
          <h2 className="sep-section-title">Thông tin lớp</h2>
          <div className="sep-fields">
            <SelectField label="Cơ sở" value={value.schoolBranchId} invalid={Boolean(errors.schoolBranchId)} onChange={(e) => set('schoolBranchId', e.target.value)}>
              <option value="">Chọn cơ sở</option>
              {reference.data?.schoolBranches
                .filter((branch) => branch.status === 'ACTIVE' || String(branch.id) === value.schoolBranchId)
                .map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                  {branch.status === 'ACTIVE' ? '' : ' (ngừng hoạt động)'}
                </option>
              ))}
            </SelectField>
            <Field label="Tên lớp" value={value.name} invalid={Boolean(errors.name)} onChange={(e) => set('name', e.target.value)} />
            <SelectField label="Trạng thái" value={value.status} onChange={(e) => set('status', e.target.value)}>
              {(Object.keys(CLASS_STATUS) as ClassStatus[]).map((code) => (
                <option key={code} value={code}>
                  {CLASS_STATUS[code].label}
                </option>
              ))}
            </SelectField>
          </div>
        </section>

        <section className="sep-section">
          <h2 className="sep-section-title">Năm học và khối</h2>
          <div className="sep-fields">
            <SelectField
              label="Năm học"
              value={value.academicYearId}
              invalid={Boolean(errors.academicYearId)}
              onChange={(e) => set('academicYearId', e.target.value)}
            >
              <option value="">Chọn năm học</option>
              {reference.data?.academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              ))}
            </SelectField>
            <SelectField label="Khối" value={value.gradeLevelId} invalid={Boolean(errors.gradeLevelId)} onChange={(e) => set('gradeLevelId', e.target.value)}>
              <option value="">Chọn khối</option>
              {reference.data?.gradeLevels.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.name}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Giáo viên chủ nhiệm"
              value={value.homeroomTeacherId}
              invalid={Boolean(errors.homeroomTeacherId)}
              fieldClassName="sep-span-2"
              disabled={!value.schoolBranchId}
              onChange={(e) => set('homeroomTeacherId', e.target.value)}
            >
              <option value="">Chưa phân công</option>
              {teachers.data?.items.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.fullName}
                  {teacher.staffCode ? ` · ${teacher.staffCode}` : ''}
                </option>
              ))}
            </SelectField>
          </div>
        </section>

        <div className="sep-actions">
          <PcbButton variant="ghost" onClick={back}>
            Huỷ
          </PcbButton>
          <PcbButton disabled={busy || !scope.schoolId || (classId !== null && !current)} onClick={submit}>
            {classId ? 'Lưu thay đổi' : 'Thêm lớp'}
          </PcbButton>
        </div>
      </div>
      {popup.dialog}
    </>
  );
};

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Field, Icon, PcbButton, SelectField } from '../../../components/pcb';
import { PageHeader } from '../../../components/common/PageHeader';
import { Pager } from '../../../components/common/Pager';
import { RowAction, RowActionButton } from '../../../components/common/RowAction';
import { StatusPill } from '../../../components/common/StatusPill';
import { StatusTabs } from '../../../components/common/StatusTabs';
import { TableState } from '../../../components/common/TableState';
import { useAsync, useBusy, useDebounce, useDirectoryScope, useNotice } from '../../../hooks';
import { api } from '../../../services/api';
import type { StudentListItem, StudentStatus } from '../../../types';
import { branchLabel, formatDay, statusOf, STUDENT_STATUS } from '../../../utils/directory';
import { isTeacher } from '../../../utils/jwt';
import { toProblem } from '../../../utils/problem';

const STATUS_TABS: { value: StudentStatus | ''; label: string; title?: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: 'ACTIVE', label: 'Đang học' },
  { value: 'TEMPORARY_LEAVE', label: 'Tạm nghỉ' },
  { value: 'TRANSFERRED', label: 'Chuyển đi' },
  { value: 'INACTIVE', label: 'Đã xoá', title: 'Hồ sơ đã xoá, vẫn giữ lịch sử học và điểm' },
];

/** SC-HS01. Nhà trường chỉ xem (giáo viên: học sinh lớp mình chủ nhiệm); admin xem + thêm/sửa/xoá. */
export const StudentListPage = () => {
  const navigate = useNavigate();
  const scope = useDirectoryScope();
  const teacher = !scope.admin && isTeacher();

  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<StudentStatus | ''>('');
  const [gradeLevelId, setGradeLevelId] = useState<number>();
  const [classId, setClassId] = useState<number>();
  const [schoolBranchId, setSchoolBranchId] = useState<number>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const popup = useNotice();
  const [busy, runExclusive] = useBusy();
  const debouncedKeyword = useDebounce(keyword, 300);

  // Lọc Khối / Lớp / Cơ sở áp theo lớp hiện tại (năm học đang hoạt động), nên chỉ cần lớp của năm đó.
  const reference = useAsync(
    async () => (scope.ready ? api.directory.referenceData(undefined, scope.schoolId) : null),
    [scope.ready, scope.schoolId],
  );
  const grades = reference.data?.gradeLevels ?? [];
  const classes = reference.data?.classes ?? [];
  const branches = reference.data?.schoolBranches ?? [];

  const query = {
    page,
    pageSize,
    search: debouncedKeyword.trim() || undefined,
    status: status || undefined,
    gradeLevelId,
    classId,
    schoolBranchId,
  };
  const list = useAsync(
    async () => (scope.ready ? api.directory.students(query, scope.schoolId) : null),
    [scope.ready, scope.schoolId, ...Object.values(query)],
  );
  const items = list.data?.items ?? [];
  const totalCount = list.data?.totalCount ?? 0;
  const filtered = Boolean(keyword || status || gradeLevelId || classId || schoolBranchId);

  const onFilter = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };
  const reset = () => {
    setKeyword('');
    setStatus('');
    setGradeLevelId(undefined);
    setClassId(undefined);
    setSchoolBranchId(undefined);
    setPage(1);
  };
  const numberOrUndefined = (raw: string) => (raw ? Number(raw) : undefined);

  const remove = (row: StudentListItem) => {
    if (!scope.schoolId) return;
    popup.confirm(`Xoá học sinh ${row.fullName}? Hồ sơ chuyển sang "Đã xoá", lịch sử lớp và điểm thi vẫn được giữ.`, () => {
      void runExclusive(async () => {
        try {
          await api.directory.deleteStudent(scope.schoolId!, row.id);
          popup.success(`Đã xoá học sinh ${row.fullName}.`);
          list.reload();
        } catch (error) {
          popup.error(toProblem(error).message);
        }
      });
    }, 'Xoá học sinh');
  };

  const error = list.error ?? reference.error ?? scope.schoolsError;
  const pickedBranch = branches.find((branch) => branch.id === schoolBranchId);
  const title = scope.admin ? 'Quản lý học sinh' : teacher ? 'Học sinh lớp chủ nhiệm' : 'Hồ sơ học sinh';

  return (
    <>
      <PageHeader title={title} inline={scope.admin} />

      <div className={scope.admin ? 'sep-page sep-page--flush' : 'sep-page'}>


        <div className="sep-toolbar">
          <div className="sep-toolbar__filters">
            {scope.admin && (
              <SelectField
                label="Trường"
                hideLabel
                placeholder="Trường"
                value={scope.schoolId ?? ''}
                onChange={(event) => {
                  scope.setSchool(Number(event.target.value));
                  reset();
                }}
              >
                {scope.schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </SelectField>
            )}
            <Field
              label="Tìm kiếm"
              hideLabel
              leading="search"
              placeholder="Tìm học sinh"
              value={keyword}
              fieldClassName="sep-toolbar__search"
              onChange={(event) => onFilter(setKeyword)(event.target.value)}
            />
            <SelectField
              label="Trạng thái"
              hideLabel
              placeholder="Tất cả trạng thái"
              value={status}
              onChange={(event) => onFilter(setStatus)(event.target.value as StudentStatus | '')}
            >
              <option value="">Tất cả trạng thái</option>
              {STATUS_TABS.map((tab) => (
                <option key={tab.value} value={tab.value}>
                  {tab.label}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Lớp"
              hideLabel
              placeholder="Lớp"
              value={classId ?? ''}
              onChange={(event) => onFilter(setClassId)(numberOrUndefined(event.target.value))}
            >
              <option value="">Tất cả lớp</option>
              {classes.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>
                  {schoolClass.name}
                </option>
              ))}
            </SelectField>

            {filtered && (
              <PcbButton variant="ghost" size="sm" onClick={reset}>
                Xoá lọc
              </PcbButton>
            )}
          </div>
          {scope.admin && (
            <div className="sep-toolbar__actions">
              <PcbButton disabled={!scope.schoolId} onClick={() => navigate(scope.withSchool('/students/new'))}>
                Thêm học sinh
                <Icon name="add" size={20} />
              </PcbButton>
            </div>
          )}
        </div>

        {error != null && <div className="sep-alert" role="alert">{toProblem(error).message}</div>}

        <div className="pcb-table-wrap">
          <table className="pcb-table sep-table--dense">
            <thead>
              <tr>
                <th className="sep-col-index">STT</th>
                <th>Mã học sinh</th>
                <th className="sep-col-name">Họ và tên</th>
                <th>Ngày sinh</th>
                <th>Giới tính</th>
                <th>Khối</th>
                <th>Lớp hiện tại</th>
                <th>Cơ sở</th>
                <th>Trạng thái học tập</th>
                <th className="sep-col-actions">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, index) => (
                <tr key={row.id}>
                  <td className="sep-col-index">{(page - 1) * pageSize + index + 1}</td>
                  <td className="sep-nowrap">{row.code}</td>
                  <td>
                    <Link className="sep-row-link" to={scope.withSchool(`/students/${row.id}`)}>
                      {row.fullName}
                    </Link>
                  </td>
                  <td className="sep-nowrap">{formatDay(row.dateOfBirth)}</td>
                  <td className="sep-nowrap">{row.gender ?? '—'}</td>
                  <td className="sep-nowrap">{row.gradeLevelName ?? '—'}</td>
                  <td className="sep-nowrap">{row.className ?? <span className="sep-muted">Chưa xếp lớp</span>}</td>
                  <td className="sep-nowrap">{row.schoolBranchName ?? '—'}</td>
                  <td>
                    <StatusPill {...statusOf(STUDENT_STATUS, row.status)} />
                  </td>
                  <td className="sep-col-actions">
                    <div className="sep-row-actions">
                      <RowAction to={scope.withSchool(`/students/${row.id}`)} icon="visibility" label={`Xem học sinh ${row.fullName}`} />
                      {scope.admin && (
                        <>
                          <RowAction to={scope.withSchool(`/students/${row.id}/edit`)} icon="edit" label={`Sửa học sinh ${row.fullName}`} />
                          {row.status !== 'INACTIVE' && (
                            <RowActionButton icon="delete" label={`Xoá học sinh ${row.fullName}`} disabled={busy} onClick={() => remove(row)} />
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <TableState
            loading={list.loading || !scope.ready}
            failed={error != null}
            empty={items.length === 0}
            columns={11}
            title={
              filtered
                ? 'Không có học sinh nào khớp bộ lọc.'
                : teacher
                  ? 'Lớp bạn chủ nhiệm chưa có học sinh, hoặc bạn chưa được phân công chủ nhiệm.'
                  : 'Chưa có học sinh nào.'
            }
            action={
              filtered && (
                <PcbButton variant="secondary" size="sm" onClick={reset}>
                  Xoá bộ lọc
                </PcbButton>
              )
            }
          />
        </div>

        {pickedBranch && pickedBranch.status !== 'ACTIVE' && (
          <div className="sep-alert sep-alert--warn" role="status">
            {pickedBranch.name} đã ngừng hoạt động. Danh sách trên là học sinh cũ của phân hiệu này.
          </div>
        )}

        {totalCount > 0 && (
          <Pager
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            itemLabel="học sinh"
            onChange={setPage}
            onPageSizeChange={onFilter(setPageSize)}
          />
        )}
      </div>
      {popup.dialog}
    </>
  );
};

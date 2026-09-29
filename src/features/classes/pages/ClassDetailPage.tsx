import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Icon, PcbButton } from '../../../components/pcb';
import { InfoGrid, type InfoItem } from '../../../components/common/InfoGrid';
import { PageHeader } from '../../../components/common/PageHeader';
import { Pager } from '../../../components/common/Pager';
import { RowAction } from '../../../components/common/RowAction';
import { StatusPill } from '../../../components/common/StatusPill';
import { TableState } from '../../../components/common/TableState';
import { useAsync, useBusy, useDirectoryScope, useNotice } from '../../../hooks';
import { api } from '../../../services/api';
import { CLASS_STATUS, ENROLLMENT_STATUS, formatDay, statusOf, STUDENT_STATUS } from '../../../utils/directory';
import { toProblem } from '../../../utils/problem';

/** SC-CL02. Thông tin lớp + danh sách học sinh của lớp. Admin có thêm Sửa / Xoá. */
export const ClassDetailPage = () => {
  const navigate = useNavigate();
  const classId = Number(useParams().id);
  const scope = useDirectoryScope();
  const back = () => scope.back('/classes');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const popup = useNotice();
  const [busy, runExclusive] = useBusy();

  const detail = useAsync(
    async () => (scope.ready ? api.directory.classDetail(classId, { page, pageSize }, scope.schoolId) : null),
    [scope.ready, scope.schoolId, classId, page, pageSize],
  );
  const info = detail.data?.class;
  const students = detail.data?.students;
  const layoutClass = scope.admin ? 'sep-page sep-page--flush' : 'sep-page';

  // Chưa có dữ liệu lớp: đang tải, hoặc lỗi (không tìm thấy / ngoài phạm vi, kể cả lớp giáo viên không chủ nhiệm).
  if (!info) {
    return (
      <>
        <PageHeader title="Chi tiết lớp" onBack={back} inline={scope.admin} />
        <div className={layoutClass}>
          {detail.error ? (
            <>
              <div className="sep-alert" role="alert">
                {toProblem(detail.error).status === 404
                  ? 'Không tìm thấy lớp, hoặc bạn không có quyền xem lớp này.'
                  : toProblem(detail.error).message}
              </div>
              <div className="sep-actions">
                <PcbButton variant="secondary" onClick={back}>
                  Về danh sách lớp
                </PcbButton>
              </div>
            </>
          ) : (
            <p className="sep-empty" role="status">Đang tải…</p>
          )}
        </div>
      </>
    );
  }

  const remove = () => {
    if (!scope.schoolId) return;
    popup.confirm(`Xoá lớp ${info.name}? Lớp sẽ chuyển sang "Ngừng hoạt động" và vẫn giữ trong lịch sử học của học sinh.`, () => {
      void runExclusive(async () => {
        try {
          await api.directory.deleteClass(scope.schoolId!, info.id);
          navigate(scope.withSchool('/classes'), { replace: true });
        } catch (error) {
          // 409: lớp còn học sinh đang học — backend nói rõ cần chuyển lớp cho học sinh trước.
          popup.error(toProblem(error).message);
        }
      });
    }, 'Xoá lớp');
  };

  const state = statusOf(CLASS_STATUS, info.status);
  const items: InfoItem[] = [
    { label: 'Tên lớp', value: info.name },
    { label: 'Khối', value: info.gradeLevelName },
    { label: 'Năm học', value: info.academicYearName },
    { label: 'Cơ sở', value: info.schoolBranchName },
    { label: 'Giáo viên chủ nhiệm', value: info.homeroomTeacherName ?? 'Chưa phân công' },
    { label: 'Sĩ số', value: `${info.studentCount} học sinh đang học` },
    { label: 'Trạng thái lớp', value: state.label },
  ];
  const rows = students?.items ?? [];

  return (
    <>
      <PageHeader title={`Lớp ${info.name}`} onBack={back} badge={<StatusPill {...state} />} inline={scope.admin} />

      <div className={layoutClass}>
        <section className="sep-section">
          <h2 className="sep-section-title">Thông tin lớp</h2>
          <InfoGrid items={items} />
        </section>

        <section className="sep-section">
          <h2 className="sep-section-title">Danh sách học sinh</h2>
          <div className="pcb-table-wrap">
            <table className="pcb-table">
              <thead>
                <tr>
                  <th className="sep-col-index">STT</th>
                  <th>Mã học sinh</th>
                  <th>Họ và tên</th>
                  <th>Ngày sinh</th>
                  <th>Giới tính</th>
                  <th>Trạng thái học tập</th>
                  <th className="sep-col-actions">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.studentId}>
                    <td className="sep-col-index">{(page - 1) * pageSize + index + 1}</td>
                    <td className="sep-nowrap">{row.studentCode}</td>
                    <td>
                      <Link className="sep-row-link" to={scope.withSchool(`/students/${row.studentId}`)}>
                        {row.fullName}
                      </Link>
                    </td>
                    <td className="sep-nowrap">{formatDay(row.dateOfBirth)}</td>
                    <td className="sep-nowrap">{row.gender ?? '—'}</td>
                    <td>
                      {/* Hồ sơ vẫn "Đang học" nhưng đã rời lớp này (chuyển lớp / lớp năm cũ): hiện trạng thái ở lớp này. */}
                      <StatusPill
                        {...(row.studentStatus === 'ACTIVE' && row.enrollmentStatus !== 'ACTIVE'
                          ? statusOf(ENROLLMENT_STATUS, row.enrollmentStatus)
                          : statusOf(STUDENT_STATUS, row.studentStatus))}
                      />
                    </td>
                    <td className="sep-col-actions">
                      <div className="sep-row-actions">
                        <RowAction to={scope.withSchool(`/students/${row.studentId}`)} icon="visibility" label={`Xem học sinh ${row.fullName}`} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <TableState
              loading={detail.loading}
              failed={false}
              empty={rows.length === 0}
              columns={7}
              title="Lớp chưa có học sinh."
            />
          </div>
          {(students?.totalCount ?? 0) > 0 && (
            <Pager
              page={page}
              pageSize={pageSize}
              totalCount={students!.totalCount}
              itemLabel="học sinh"
              onChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          )}
        </section>

        {scope.admin && (
          <div className="sep-actions">
            <div className="sep-actions__lead">
              <PcbButton variant="ghost" disabled={busy} onClick={() => navigate(scope.withSchool(`/classes/${info.id}/edit`))}>
                <Icon name="edit" size={20} />
                Sửa lớp
              </PcbButton>
            </div>
            {info.status === 'ACTIVE' && (
              <PcbButton variant="danger" disabled={busy} onClick={remove}>
                Xoá lớp
              </PcbButton>
            )}
          </div>
        )}
      </div>
      {popup.dialog}
    </>
  );
};

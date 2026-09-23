import React from 'react';
import type { Student } from '../../../types';
import { formatDate } from '../../../utils/formatters';

export interface StudentTableProps {
  students: Student[];
  onDelete?: (id: string) => void;
}

export const StudentTable: React.FC<StudentTableProps> = ({ students, onDelete }) => {
  return (
    <div style={{ overflowX: 'auto', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
            <th style={{ padding: '12px 16px' }}>Mã HS</th>
            <th style={{ padding: '12px 16px' }}>Họ và tên</th>
            <th style={{ padding: '12px 16px' }}>Lớp</th>
            <th style={{ padding: '12px 16px' }}>Giới tính</th>
            <th style={{ padding: '12px 16px' }}>Ngày sinh</th>
            <th style={{ padding: '12px 16px' }}>Trạng thái</th>
            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>{student.studentCode}</td>
              <td style={{ padding: '12px 16px', color: '#334155' }}>{student.fullName}</td>
              <td style={{ padding: '12px 16px', color: '#64748b' }}>{student.className}</td>
              <td style={{ padding: '12px 16px', color: '#64748b' }}>{student.gender}</td>
              <td style={{ padding: '12px 16px', color: '#64748b' }}>{formatDate(student.dateOfBirth)}</td>
              <td style={{ padding: '12px 16px' }}>
                <span
                  style={{
                    padding: '4px 8px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: 500,
                    backgroundColor: student.status === 'Active' ? '#dcfce7' : '#fee2e2',
                    color: student.status === 'Active' ? '#166534' : '#991b1b',
                  }}
                >
                  {student.status === 'Active' ? 'Đang học' : 'Nghỉ học'}
                </span>
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                {onDelete && (
                  <button
                    onClick={() => onDelete(student.id)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 500,
                    }}
                  >
                    Xóa
                  </button>
                )}
              </td>
            </tr>
          ))}
          {students.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                Không có dữ liệu học sinh.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

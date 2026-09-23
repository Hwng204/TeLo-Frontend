import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { StudentTable } from '../components/StudentTable';
import type { Student } from '../../../types';
import { Button } from '../../../components/common/Button';
import { useDebounce } from '../../../hooks/useDebounce';

const INITIAL_STUDENTS: Student[] = [
  {
    id: '1',
    studentCode: 'HS001',
    fullName: 'Nguyễn Văn An',
    className: '10A1',
    gender: 'Nam',
    dateOfBirth: '2008-05-12',
    status: 'Active',
  },
  {
    id: '2',
    studentCode: 'HS002',
    fullName: 'Trần Thị Bình',
    className: '10A1',
    gender: 'Nữ',
    dateOfBirth: '2008-08-20',
    status: 'Active',
  },
  {
    id: '3',
    studentCode: 'HS003',
    fullName: 'Lê Hoàng Cường',
    className: '10A2',
    gender: 'Nam',
    dateOfBirth: '2008-01-15',
    status: 'Inactive',
  },
];

export const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const filteredStudents = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      s.className.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa học sinh này không?')) {
      setStudents((prev) => prev.filter((s) => s.id !== id));
    }
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Quản lý học sinh</h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
            Danh sách hồ sơ học sinh toàn trường
          </p>
        </div>
        <Button>
          <Plus size={16} />
          <span>Thêm học sinh</span>
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div style={{ marginBottom: '16px', maxWidth: '360px', position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px' }} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm theo mã, họ tên, lớp..."
          style={{
            width: '100%',
            padding: '10px 12px 10px 38px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '14px',
            outline: 'none',
            boxSizing: 'border-box',
            backgroundColor: '#ffffff',
          }}
        />
      </div>

      {/* Table */}
      <StudentTable students={filteredStudents} onDelete={handleDelete} />
    </div>
  );
};

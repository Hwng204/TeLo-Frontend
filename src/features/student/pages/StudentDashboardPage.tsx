import React from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { getUsername } from '../../../utils/jwt';

export const StudentDashboardPage: React.FC = () => {
  const username = getUsername();
  
  return (
    <div>
      <PageHeader title="Tổng quan" inline />
      
      <div style={{ 
        marginTop: '24px', 
        backgroundColor: '#f5f3ff', 
        padding: '32px', 
        borderRadius: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ fontSize: '28px', color: '#1e293b', margin: '0 0 12px 0' }}>
            Chào mừng, {username || 'Học sinh'}!
          </h2>
          <p style={{ color: '#475569', fontSize: '16px', margin: 0, maxWidth: '600px', lineHeight: '1.5' }}>
            Hôm nay là một ngày tuyệt vời để học tập. Bạn có 1 bài kiểm tra sắp diễn ra, hãy chuẩn bị thật tốt nhé.
          </p>
        </div>
      </div>
      
      <div style={{ marginTop: '24px', display: 'flex', gap: '24px' }}>
        <div style={{ flex: 2, backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
              <span style={{ color: '#ef4444' }}>📅</span> Kỳ thi sắp diễn ra
            </h3>
            <a href="#" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '14px' }}>Xem tất cả</a>
          </div>
          
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex' }}>
            <div style={{ flex: 1, paddingRight: '20px', borderRight: '1px solid #e2e8f0' }}>
              <div style={{ display: 'inline-block', backgroundColor: '#f0f9ff', color: '#0284c7', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', marginBottom: '12px' }}>
                Môn Toán học
              </div>
              <h4 style={{ fontSize: '20px', color: '#0f172a', margin: '0 0 12px 0' }}>Kiểm tra cuối học kỳ - Toán lớp 5</h4>
              <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 20px 0' }}>Đề thi đánh giá năng lực học kỳ 1 theo chuẩn của Bộ Giáo dục.</p>
              
              <div style={{ display: 'flex', gap: '24px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ width: '40px', height: '40px', backgroundColor: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    📅
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Ngày thi</div>
                    <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 500 }}>Thứ 6, 24 Tháng 11</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ width: '40px', height: '40px', backgroundColor: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    🕒
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Thời gian làm bài</div>
                    <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 500 }}>60 phút (08:00 - 09:00)</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ width: '200px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>Trạng thái</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#059669', fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>
                <span style={{ width: '8px', height: '8px', backgroundColor: '#059669', borderRadius: '50%' }}></span>
                Sắp bắt đầu
              </div>
              <button style={{ padding: '10px', backgroundColor: 'white', border: '1px solid #3b82f6', color: '#3b82f6', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
                Kiểm tra thiết bị
              </button>
            </div>
          </div>
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: '#fff7ed', borderRadius: '8px' }}></div>
            <div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>Điểm trung bình</div>
              <div style={{ fontSize: '24px', color: '#0f172a', fontWeight: 600 }}>8.5 <span style={{ fontSize: '14px', color: '#059669', fontWeight: 400 }}>Tốt</span></div>
            </div>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: '#059669', borderRadius: '8px' }}></div>
            <div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>Bài tập hoàn thành</div>
              <div style={{ fontSize: '24px', color: '#0f172a', fontWeight: 600 }}>24/25</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TOKEN_KEY = 'telo_auth_token';
const USER_KEY = 'telo_auth_user';

export const storage = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },

  getUser: <T>(): T | null => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  setUser: <T>(user: T): void => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  removeUser: (): void => {
    localStorage.removeItem(USER_KEY);
  },

  getSelectedBranch: (): {
    schoolId: string | null;
    schoolCode: string | null;
    schoolName: string | null;
    branchId: string | null;
    branchCode: string | null;
    branchName: string | null;
  } => {
    let sId: string | null = null;
    let bId: string | null = null;
    const token = localStorage.getItem('_sc_token');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token));
        sId = decoded.s || decoded.sId || null;
        bId = decoded.b || decoded.bId || null;
      } catch {
        // fallback
      }
    }
    // Fallback nếu token chưa được tạo từ phiên trước
    if (!sId) sId = localStorage.getItem('selected_school_id');
    if (!bId) bId = localStorage.getItem('selected_branch_id');

    return {
      schoolId: sId,
      schoolCode: localStorage.getItem('selected_school_code'),
      schoolName: localStorage.getItem('selected_school_name'),
      branchId: bId,
      branchCode: localStorage.getItem('selected_branch_code'),
      branchName: localStorage.getItem('selected_branch_name'),
    };
  },
  setSelectedBranch: (
    schoolOrObj: string | { schoolId: string; schoolCode?: string; schoolName: string; branchId: string; branchCode?: string; branchName: string },
    schoolName?: string,
    branchId?: string,
    branchName?: string,
    schoolCode?: string,
    branchCode?: string,
  ): void => {
    let sId = '';
    let sCode = '';
    let sName = '';
    let bId = '';
    let bCode = '';
    let bName = '';

    if (typeof schoolOrObj === 'object') {
      sId = String(schoolOrObj.schoolId || '');
      sCode = schoolOrObj.schoolCode || '';
      sName = schoolOrObj.schoolName || '';
      bId = String(schoolOrObj.branchId || '');
      bCode = schoolOrObj.branchCode || '';
      bName = schoolOrObj.branchName || '';
    } else {
      sId = String(schoolOrObj || '');
      sName = schoolName || '';
      bId = String(branchId || '');
      bName = branchName || '';
      sCode = schoolCode || '';
      bCode = branchCode || '';
    }

    // Lưu mã trường và mã phân hiệu thay vì lộ ID số nguyên
    if (sCode) localStorage.setItem('selected_school_code', sCode);
    if (sName) localStorage.setItem('selected_school_name', sName);
    if (bCode) localStorage.setItem('selected_branch_code', bCode);
    if (bName) localStorage.setItem('selected_branch_name', bName);

    // Mã hoá ID để gọi API an toàn mà không để lộ ID số trực tiếp ở key localStorage
    try {
      localStorage.setItem('_sc_token', btoa(JSON.stringify({ s: sId, b: bId })));
    } catch {
      // bỏ qua nếu btoa lỗi
    }

    // Xoá các khoá ID cũ
    localStorage.removeItem('selected_school_id');
    localStorage.removeItem('selected_branch_id');

    window.dispatchEvent(new Event('branch_changed'));
  },
  clearSelectedBranch: (): void => {
    localStorage.removeItem('selected_school_code');
    localStorage.removeItem('selected_school_name');
    localStorage.removeItem('selected_branch_code');
    localStorage.removeItem('selected_branch_name');
    localStorage.removeItem('_sc_token');
    localStorage.removeItem('selected_school_id');
    localStorage.removeItem('selected_branch_id');
    window.dispatchEvent(new Event('branch_changed'));
  },

  clearAuth: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    storage.clearSelectedBranch();
    // Đăng xuất/hết hạn không được để lại bản nháp chưa lưu của người trước trên máy dùng chung.
    try {
      Object.keys(sessionStorage)
        .filter((key) => key.startsWith('matrix-draft:') || key.startsWith('email-context:') || key.startsWith('academic-year-context:'))
        .forEach((key) => sessionStorage.removeItem(key));
    } catch {
      // sessionStorage bị chặn: không có gì để dọn.
    }
  },
};

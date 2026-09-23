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

  clearAuth: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Đăng xuất/hết hạn không được để lại bản nháp chưa lưu của người trước trên máy dùng chung.
    try {
      Object.keys(sessionStorage)
        .filter((key) => key.startsWith('matrix-draft:'))
        .forEach((key) => sessionStorage.removeItem(key));
    } catch {
      // sessionStorage bị chặn: không có gì để dọn.
    }
  },
};

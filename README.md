# TeLo Frontend

## Chạy local và kiểm tra năm học

Chạy backend theo README của `TeLo-Backend` và cập nhật database trước khi dùng giao diện.
Trong thư mục frontend:

```powershell
npm install
$env:VITE_API_BASE_URL = 'https://localhost:7033/api'
npm run dev
```

Địa chỉ API mặc định khi không cấu hình là `http://localhost:5035/api`. Sau khi đổi biến
môi trường, khởi động lại Vite. Nếu dùng HTTPS local, tin cậy chứng chỉ bằng
`dotnet dev-certs https --trust` ở terminal .NET.

Mở `/academic-years` sau khi đăng nhập. Danh sách có tìm kiếm, lọc trạng thái và phân trang.
Tạo hoặc lưu năm học gửi lịch hai học kỳ trong một request để tránh lưu một phần dữ liệu.
Form báo lỗi tại trường, khóa học kỳ đã kết thúc, yêu cầu xác nhận khi kết thúc và báo khi
phiên bản dữ liệu đã cũ. Tài khoản có role `OperationalAdmin`, `ADMIN` hoặc permission
`academic_calendar.manage` được thao tác; backend kiểm tra quyền cho mọi request ghi.

Kiểm tra validation (Node 22.6+), lint các file nghiệp vụ và build:

```powershell
node --experimental-strip-types src/utils/academicYear.selfcheck.ts
npx eslint src/features/academicYears/pages/*.tsx src/utils/academicYear.ts src/utils/academicYear.selfcheck.ts src/utils/jwt.ts src/types/academicYear.ts
npm run build
```

Kiểm tra thủ công: tạo đủ hai học kỳ; thử ngày thiếu, sai thứ tự, ngoài năm học hoặc trùng
nhau; áp dụng năm; kết thúc học kỳ I rồi II; thử sửa học kỳ đã kết thúc. Mở cùng năm học
trên hai tab, lưu tab thứ nhất rồi lưu tab thứ hai để kiểm tra báo xung đột phiên bản.
Kiểm thử request HTTP không thay thế kiểm tra thao tác và bố cục trên trình duyệt.

Nhãn năm học ở header, trang đăng nhập và trang phân hiệu lấy từ
`GET /api/academic-years/current`. Nguồn dữ liệu là năm có trạng thái `ACTIVE`, kể cả
khi đang dùng một năm tương lai để test. Chưa có năm áp dụng thì hiển thị trạng thái
trống; lỗi tải có thông báo riêng. Header cập nhật sau khi lưu/áp dụng/kết thúc năm học,
khi đổi trang hoặc quay lại tab. Sau khi cập nhật code, cần khởi động lại backend để
nạp endpoint mới. Phần này không cần migration hoặc thư viện mới.

## Vai trò, người dùng và module

Sau khi áp dụng migration Identity Management của backend, dùng các mục có sẵn trên
sidebar: `/roles`, `/users`, `/modules`. Các màn này yêu cầu vai trò `ADMIN`, `Admin`
hoặc `OperationalAdmin`; backend quyết định quyền truy cập cuối cùng.

- Vai trò: tìm kiếm, lọc trạng thái/trường/phân hiệu, phân trang; thêm/sửa thông tin;
  kích hoạt/ngừng áp dụng; chỉ xóa khi backend xác nhận chưa được sử dụng.
- Chọn tên vai trò để xem danh sách thành viên có phân trang, gán hàng loạt tối đa
  100 người dùng đủ điều kiện hoặc thu hồi. Danh sách đã chọn giữ nguyên khi đổi trang.
- Người dùng: tìm kiếm/lọc/phân trang và gán nhiều vai trò trong một lần lưu. Vai trò
  đã gán, kể cả ngừng áp dụng, được giữ lại đến khi chủ động bỏ chọn. Không được tự
  thu hồi quyền quản trị cuối cùng của mình.
- Module: mã/tên/mô tả, phân trang, trạng thái và xóa khi chưa có liên kết. Trạng thái
  quản lý danh mục, không phải công tắc chặn truy cập chức năng.

Tạo vai trò không tự động tạo quyền API. Biểu mẫu giữ nguyên mã sau khi tạo. Thông báo
`STALE_VERSION` yêu cầu mở lại dữ liệu; xung đột nghiệp vụ khác vẫn cho phép sửa đầu vào.
Gán/thu hồi vai trò có thể yêu cầu người dùng liên quan đăng nhập lại.

```powershell
node --experimental-strip-types src/utils/identity.selfcheck.ts
npx eslint src/features/identity src/utils/identity.ts src/utils/identity.selfcheck.ts src/types/identity.ts src/routes/AppRoutes.tsx
npm run build
```

Kiểm tra trình duyệt trước triển khai: đổi trang/bộ lọc; chọn nhiều bản ghi qua các
trang rồi lưu; thử mã trùng/tên trống/phạm vi khác trường; sửa cùng bản ghi trên hai
tab; thử thu hồi quyền quản trị cuối cùng; dùng Tab, Shift+Tab và Escape trong hộp
thoại; kiểm tra bố cục ở 320/768/1024/1440 px. Build và self-check không thay thế kiểm
tra giao diện/API thực tế. Môi trường công cụ hiện tại chưa cung cấp trình duyệt để
thực hiện các kiểm tra hình ảnh và bàn phím này.

## React + TypeScript + Vite template

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

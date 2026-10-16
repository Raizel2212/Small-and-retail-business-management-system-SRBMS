# Ứng Dụng Mobile Quản Lý Hộ Kinh Doanh (SRBMS Mobile)

Dự án ứng dụng di động được xây dựng bằng **React Native (Expo SDK 58, TypeScript)** kết nối với Backend **Spring Boot 3.3.4 (REST API, JWT, Spring Security 6)**.

---

## 1. Cấu Trúc Mã Nguồn

```
mobile-app/
├── assets/                       # Biểu tượng, splash screen
├── src/
│   ├── api/
│   │   ├── client.ts             # Cấu hình Axios, Interceptor tự động gắn JWT Bearer và bắt lỗi Backend
│   │   ├── config.ts             # Thiết lập Base URL (LAN IP, Android Emulator, iOS/Web)
│   │   └── authApi.ts            # Gọi API /api/v1/auth/login, /api/v1/auth/register, ping server
│   ├── components/
│   │   ├── BrandLogo.tsx         # Vector SVG logo Hộ Kinh Doanh (nhà + mũi tên cam + lá non)
│   │   ├── BottomCurve.tsx       # Đường cong trang trí màu xanh ở chân trang theo mockup
│   │   ├── CustomButton.tsx      # Nút bấm chuẩn thiết kế, hỗ trợ loading spinner, disabled
│   │   ├── CustomInput.tsx       # Ô nhập liệu có icon, ẩn/hiện mật khẩu, thông báo lỗi validate
│   │   ├── ForgotPasswordModal.tsx# Modal hướng dẫn phục hồi tài khoản theo CCCD
│   │   └── ServerConfigModal.tsx # Cửa sổ đổi/kiểm tra nhanh IP máy chủ ngay trong App
│   ├── context/
│   │   └── AuthContext.tsx       # Quản lý State: user, token, login(), register(), logout(), tự động lưu AsyncStorage
│   ├── screens/
│   │   ├── WelcomeScreen.tsx     # Màn hình chào mừng khớp 100% với ảnh mockup thiết kế
│   │   ├── LoginScreen.tsx       # Màn hình Đăng nhập (Số CCCD 12 số, Mật khẩu, xử lý mã 401/403)
│   │   ├── RegisterScreen.tsx    # Màn hình Đăng ký (Đầy đủ trường DTO: Họ tên, CCCD, SĐT, Email, Password...)
│   │   └── HomeScreen.tsx        # Trang chủ Dashboard sau khi đăng nhập thành công
│   ├── types/
│   │   └── auth.ts               # Định nghĩa kiểu dữ liệu User, AuthData, ApiResponse, Request DTOs
│   └── utils/
│       └── validation.ts         # Quy tắc kiểm tra định dạng CCCD (12 số), SĐT VN, Email, Mật khẩu
├── App.tsx                       # Component gốc và bộ điều hướng (Routing)
├── package.json
└── tsconfig.json
```

---

## 2. Hướng Dẫn Chạy Ứng Dụng

### Bước 1: Khởi động máy chủ Spring Boot Backend
Đảm bảo Backend SRBMS đang chạy ở cổng `8080` (ví dụ `http://localhost:8080`).

### Bước 2: Khởi động Mobile App
Trong thư mục `mobile-app`:

```bash
# Khởi động Expo Dev Server
npm start
# Hoặc:
npx expo start
```

### Bước 3: Xem trên thiết bị hoặc máy ảo
* **Quét mã QR bằng Expo Go** trên điện thoại Android/iOS (cùng mạng Wi-Fi).
* **Nhấn phím `a`** để mở trên Android Emulator.
* **Nhấn phím `i`** để mở trên iOS Simulator.
* **Nhấn phím `w`** để mở trên trình duyệt Web.

---

## 3. Cấu Hình Địa Chỉ IP Backend (Rất Tiện Lợi)

Ứng dụng tích hợp sẵn nút cấu hình hình bánh răng ở góc trên màn hình:
* **Wi-Fi LAN (Điện thoại thật qua Expo Go)**: Mặc định `http://192.168.1.5:8080`
* **Android Emulator**: `http://10.0.2.2:8080`
* **iOS Simulator / Web**: `http://localhost:8080`
* Có nút **"Kiểm tra kết nối (Ping)"** trực tiếp trên màn hình để kiểm tra Backend có online hay không trước khi bấm Đăng nhập.

---

## 4. Kiểm Thử Các Chức Năng Xác Thực

### A. Đăng ký tài khoản (Register)
* Gửi `POST /api/v1/auth/register`
* Kiểm tra đầy đủ:
  - CCCD đúng 12 chữ số (`^[0-9]{12}$`)
  - SĐT đúng định dạng Việt Nam (`^(0|+84)[0-9]{9}$`)
  - Email hợp lệ
  - Mật khẩu tối thiểu 6 ký tự
* Khi thành công (201 Created): Tự động điền số CCCD sang màn hình Đăng nhập.
* Khi trùng lặp (409 Conflict): Hiển thị thông báo chính xác từ Backend (VD: "Tài khoản đã tồn tại (Số CCCD này đã được đăng ký)").

### B. Đăng nhập (Login)
* Gửi `POST /api/v1/auth/login` với `{ cccd, password }`
* Khi thành công (200 OK):
  - Lưu `accessToken` (JWT) và `user` vào AsyncStorage.
  - Tự động điều hướng đến **Trang chủ (HomeScreen)**.
* Khi sai tài khoản / mật khẩu: Hiển thị đúng thông điệp lỗi (401 Unauthorized).
* Khi tài khoản bị khóa: Báo 403 Forbidden.

### C. Trang chủ (HomeScreen)
* Hiển thị thông tin cá nhân: Họ tên, Số CCCD, SĐT, Email, Vai trò (`ROLE_USER`), Trạng thái (`ACTIVE`).
* Hiển thị trạng thái phiên JWT và thời hạn 24 giờ.
* Nút **Đăng xuất (Logout)**: Xóa token trong bộ nhớ và quay lại màn hình Welcome/Login.

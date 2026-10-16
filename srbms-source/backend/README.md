# SRBMS Backend - Dịch vụ Xác thực & Quản lý Hộ Kinh Doanh

Dự án Backend xây dựng trên **Spring Boot 3.3.4**, **Java 21**, **PostgreSQL** và **Spring Security + JWT + BCrypt**.

---

## 1. Cấu hình Cơ sở dữ liệu (PostgreSQL / pgAdmin 4)

1. Mở **pgAdmin 4**, tạo một database tên là: `srbms_db`.
2. Mở file [application.yml](src/main/resources/application.yml) và điền mật khẩu tài khoản PostgreSQL của bạn vào `spring.datasource.password`:
   ```yaml
   spring:
     datasource:
       url: jdbc:postgresql://localhost:5432/srbms_db
       username: postgres
       password: YOUR_POSTGRES_PASSWORD # <-- Thay bằng mật khẩu PostgreSQL của bạn
   ```
3. Tính năng **tự động tạo bảng** đã được bật sẵn thông qua:
   ```yaml
   spring:
     jpa:
       hibernate:
         ddl-auto: update
   ```
   *Khi bạn bấm RUN project lần đầu, Hibernate sẽ tự động sinh bảng `users` và các chỉ mục trong pgAdmin 4.*

---

## 2. Cách chạy ứng dụng

### Cách 1: Chạy bằng Terminal
```powershell
cd d:\HoKinhDoanProject\srbms-source\backend
mvn spring-boot:run
```

### Cách 2: Chạy trên IntelliJ IDEA / Eclipse / VS Code
- Mở class [SrBmsApplication.java](src/main/java/com/srbms/SrBmsApplication.java).
- Nhấn nút **Run** (biểu tượng tam giác xanh).

---

## 3. Danh sách API (Endpoints)

### a. Đăng ký tài khoản (Register)
- **Method**: `POST`
- **URL**: `http://localhost:8080/api/v1/auth/register`
- **Request Body (JSON)**:
```json
{
  "cccd": "079201001234",
  "password": "Password123@",
  "fullName": "Nguyễn Văn A",
  "username": "vana_owner",
  "sdt": "0901234567",
  "email": "vana@gmail.com",
  "dateOfBirth": "1995-05-20"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "Đăng ký tài khoản thành công"
}
```

---

### b. Đăng nhập (Login)
- **Method**: `POST`
- **URL**: `http://localhost:8080/api/v1/auth/login` (hoặc `http://localhost:8080/api/v1/login`)
- **Request Body (JSON)**:
```json
{
  "cccd": "079201001234",
  "password": "Password123@"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "tokenType": "Bearer",
    "expiresIn": 86400000,
    "user": {
      "id": 1,
      "cccd": "079201001234",
      "username": "vana_owner",
      "fullName": "Nguyễn Văn A",
      "email": "vana@gmail.com",
      "sdt": "0901234567",
      "role": "ROLE_USER",
      "status": "ACTIVE"
    }
  }
}
```

---

## 4. Cấu trúc thư mục

```text
backend/
├── pom.xml
├── README.md
└── src/
    ├── main/
    │   ├── java/com/srbms/
    │   │   ├── SrBmsApplication.java
    │   │   ├── config/
    │   │   │   └── SecurityConfig.java
    │   │   ├── controller/
    │   │   │   ├── AuthController.java
    │   │   │   └── LoginController.java
    │   │   ├── dto/
    │   │   │   ├── UserDto.java
    │   │   │   ├── request/
    │   │   │   │   ├── LoginRequest.java
    │   │   │   │   └── RegisterRequest.java
    │   │   │   └── response/
    │   │   │       ├── ApiResponse.java
    │   │   │       └── AuthResponse.java
    │   │   ├── entity/
    │   │   │   └── User.java
    │   │   ├── exception/
    │   │   │   ├── AppException.java
    │   │   │   └── GlobalExceptionHandler.java
    │   │   ├── repository/
    │   │   │   └── UserRepository.java
    │   │   ├── security/
    │   │   │   ├── JwtAuthenticationFilter.java
    │   │   │   └── JwtTokenProvider.java
    │   │   └── service/
    │   │       ├── AuthService.java
    │   │       └── impl/
    │   │           └── AuthServiceImpl.java
    │   └── resources/
    │       ├── application.yml
    │       └── schema.sql
    └── test/
        └── java/com/srbms/
            └── service/
                └── AuthServiceTest.java
```

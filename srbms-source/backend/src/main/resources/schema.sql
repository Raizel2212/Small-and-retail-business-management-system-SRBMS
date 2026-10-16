-- ========================================================
-- Schema DDL cho PostgreSQL (pgAdmin 4)
-- Dự án: SRBMS (Hộ kinh doanh bán lẻ)
-- Lưu ý: Hibernate (ddl-auto: update) sẽ tự động tạo bảng này
-- khi bạn bấm RUN ứng dụng Spring Boot.
-- File này dùng để tham khảo hoặc tạo thủ công nếu cần.
-- ========================================================

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    cccd VARCHAR(12) NOT NULL,
    password VARCHAR(255) NOT NULL,
    username VARCHAR(50),
    full_name VARCHAR(100) NOT NULL,
    sdt VARCHAR(15) NOT NULL,
    email VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    role VARCHAR(30) NOT NULL DEFAULT 'ROLE_USER',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_cccd UNIQUE (cccd),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT uq_users_sdt UNIQUE (sdt)
);

CREATE INDEX IF NOT EXISTS idx_users_cccd ON users (cccd);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_sdt ON users (sdt);

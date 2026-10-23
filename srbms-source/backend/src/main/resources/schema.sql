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
    is_first_login BOOLEAN NOT NULL DEFAULT TRUE,
    business_group INT,
    business_type VARCHAR(100),
    other_business_type VARCHAR(255),
    business_name VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_cccd UNIQUE (cccd),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT uq_users_sdt UNIQUE (sdt)
);

CREATE INDEX IF NOT EXISTS idx_users_cccd ON users (cccd);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_sdt ON users (sdt);

CREATE TABLE IF NOT EXISTS revenue_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    transaction_date DATE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    product_name VARCHAR(255),
    quantity INT DEFAULT 0,
    unit_price NUMERIC(15, 2),
    is_retail_customer BOOLEAN DEFAULT FALSE,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'TIEN_MAT',
    payment_status VARCHAR(50) NOT NULL DEFAULT 'DA_THU',
    note VARCHAR(500),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_revenue_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rev_tx_user_id ON revenue_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_rev_tx_date ON revenue_transactions (transaction_date);
CREATE INDEX IF NOT EXISTS idx_rev_tx_status ON revenue_transactions (payment_status);


-- Customer accounts, sessions and delivery addresses for the storefront.
-- Every table starts with shop_ so it can live in the same MySQL database as the existing ERP without touching its tables.
-- Source of truth: these tables own the *customer* (login, sessions, address book). Products, stock and orders stay in the ERP
-- until we audit it; orders will reference shop_customers.id and keep their own address snapshot (see docs/BACKEND_PLAN.md).

CREATE TABLE IF NOT EXISTS shop_customers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  -- always stored lower-case; UNIQUE is what prevents two accounts for one email, whatever the sign-in method
  email VARCHAR(254) NOT NULL,
  -- NULL for an account created with Google that has never set a password
  password_hash VARCHAR(255) NULL,
  -- 1 once Google or an emailed code has proven the owner controls the address
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  picture_url VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_shop_customers_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One row per outside sign-in method linked to a customer (Google today).
CREATE TABLE IF NOT EXISTS shop_customer_identities (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NOT NULL,
  provider VARCHAR(20) NOT NULL,
  provider_user_id VARCHAR(191) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_shop_identity (provider, provider_user_id),
  KEY idx_shop_identity_customer (customer_id),
  CONSTRAINT fk_shop_identity_customer FOREIGN KEY (customer_id) REFERENCES shop_customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Server-side sessions. The browser holds a random token in an httpOnly cookie; only its SHA-256 hash is stored here,
-- so a copy of this table cannot be used to sign in.
CREATE TABLE IF NOT EXISTS shop_sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  user_agent VARCHAR(255) NULL,
  UNIQUE KEY uq_shop_sessions_token (token_hash),
  KEY idx_shop_sessions_customer (customer_id),
  KEY idx_shop_sessions_expiry (expires_at),
  CONSTRAINT fk_shop_session_customer FOREIGN KEY (customer_id) REFERENCES shop_customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- The customer's address book. `phone` is the delivery contact (ten digits) and is deliberately NOT the login: there is no
-- phone column on shop_customers, so the two can never be mixed up.
CREATE TABLE IF NOT EXISTS shop_customer_addresses (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NOT NULL,
  type ENUM('Home', 'Office', 'Other') NOT NULL DEFAULT 'Home',
  label VARCHAR(30) NOT NULL DEFAULT '',
  recipient_name VARCHAR(80) NOT NULL,
  phone CHAR(10) NOT NULL,
  house VARCHAR(120) NOT NULL,
  street VARCHAR(160) NOT NULL,
  city VARCHAR(60) NOT NULL,
  state VARCHAR(60) NOT NULL,
  pincode CHAR(6) NOT NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_shop_addresses_customer (customer_id),
  CONSTRAINT fk_shop_address_customer FOREIGN KEY (customer_id) REFERENCES shop_customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Password-reset codes: six digits, stored hashed, short-lived, limited attempts.
CREATE TABLE IF NOT EXISTS shop_password_resets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NOT NULL,
  code_hash CHAR(64) NOT NULL,
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  KEY idx_shop_resets_customer (customer_id),
  CONSTRAINT fk_shop_reset_customer FOREIGN KEY (customer_id) REFERENCES shop_customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

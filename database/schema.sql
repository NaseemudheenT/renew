-- Renew — MySQL schema (Hostinger). Firestore is the source of truth for the
-- data model. Money is DECIMAL (never FLOAT); epoch-millisecond fields are
-- BIGINT (the app stores ms since epoch); text is utf8mb4; timestamps default to
-- UTC. IDs are VARCHAR so existing Firestore ids can be preserved on migration.
--
-- Ownership: every user-owned row FKs to users(id) ON DELETE CASCADE. A deleted
-- account must NOT destroy its transactions, so transactions.account_id is
-- ON DELETE SET NULL.
--
-- Apply:  mysql -h $DB_HOST -u $DB_USER -p $DB_NAME < database/schema.sql

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ---------------------------------------------------------------------------
-- Users & auth
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                    VARCHAR(128) NOT NULL,
  email                 VARCHAR(320) NULL,
  email_verified        TINYINT(1) NOT NULL DEFAULT 0,
  password_hash         VARCHAR(255) NULL,          -- Argon2id; NULL for OAuth/passkey-only
  display_name          VARCHAR(120) NULL,
  photo_url             TEXT NULL,
  avatar                VARCHAR(32) NULL,
  onboarded             TINYINT(1) NOT NULL DEFAULT 0,
  setup_version         INT NOT NULL DEFAULT 0,
  timezone              VARCHAR(64) NULL,
  locale                VARCHAR(16) NULL,
  region                VARCHAR(8) NULL,
  currency              CHAR(3) NULL,
  week_start            TINYINT NULL,               -- 0 Sun, 1 Mon
  hour12                TINYINT(1) NULL,
  account_type          ENUM('personal','business') NOT NULL DEFAULT 'personal',
  focus                 JSON NULL,
  accepted_legal_at     BIGINT NULL,
  monthly_income        DECIMAL(18,2) NULL,
  plan                  ENUM('free','premium') NOT NULL DEFAULT 'free',
  plan_since            BIGINT NULL,
  premium_interest      TINYINT(1) NOT NULL DEFAULT 0,
  security              JSON NULL,                  -- passcode record (salted hash, kind, faceOnly, biometricEnabled)
  ren_prefs             JSON NULL,                  -- autoSpeak, voiceURI, voiceRate, style, personality
  ren_memory            JSON NULL,
  custom_categories     JSON NULL,
  custom_subcategories  JSON NULL,
  ignored_recurring     JSON NULL,
  data_retention_days   INT NULL,
  notification_prefs    JSON NULL,
  disabled              TINYINT(1) NOT NULL DEFAULT 0,
  created_at            BIGINT NOT NULL,
  updated_at            BIGINT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  id          VARCHAR(64) NOT NULL,
  user_id     VARCHAR(128) NOT NULL,
  token_hash  CHAR(64) NOT NULL,                    -- SHA-256 of the session token (raw token only in the cookie)
  user_agent  VARCHAR(255) NULL,
  ip          VARCHAR(45) NULL,
  created_at  BIGINT NOT NULL,
  expires_at  BIGINT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sessions_token (token_hash),
  KEY idx_sessions_user (user_id),
  KEY idx_sessions_expires (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS oauth_accounts (
  id                   VARCHAR(64) NOT NULL,
  user_id              VARCHAR(128) NOT NULL,
  provider             VARCHAR(32) NOT NULL,        -- google, apple, ...
  provider_account_id  VARCHAR(255) NOT NULL,
  created_at           BIGINT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_oauth_provider_acct (provider, provider_account_id),
  KEY idx_oauth_user (user_id),
  CONSTRAINT fk_oauth_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS otp_challenges (
  id          VARCHAR(64) NOT NULL,
  identifier  VARCHAR(320) NOT NULL,                -- email or phone
  code_hash   CHAR(64) NOT NULL,
  purpose     VARCHAR(32) NOT NULL,                 -- verify_email, sign_in, ...
  attempts    INT NOT NULL DEFAULT 0,
  created_at  BIGINT NOT NULL,
  expires_at  BIGINT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_otp_identifier (identifier),
  KEY idx_otp_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS passkeys (
  id          VARCHAR(255) NOT NULL,                -- credential id (base64url)
  user_id     VARCHAR(128) NOT NULL,
  public_key  TEXT NOT NULL,
  counter     BIGINT NOT NULL DEFAULT 0,
  transports  JSON NULL,
  created_at  BIGINT NOT NULL,
  last_used_at BIGINT NULL,
  PRIMARY KEY (id),
  KEY idx_passkeys_user (user_id),
  CONSTRAINT fk_passkeys_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Money — accounts, transactions, budgets, savings, investments, transfers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounts (
  id               VARCHAR(64) NOT NULL,
  user_id          VARCHAR(128) NOT NULL,
  name             VARCHAR(120) NOT NULL,
  atype            VARCHAR(32) NOT NULL,
  currency         CHAR(3) NOT NULL,
  opening_balance  DECIMAL(18,2) NOT NULL DEFAULT 0,
  status           ENUM('active','archived') NOT NULL DEFAULT 'active',
  scope            ENUM('personal','business') NOT NULL DEFAULT 'personal',
  created_at       BIGINT NOT NULL,
  updated_at       BIGINT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_accounts_user (user_id),
  KEY idx_accounts_status (user_id, status),
  CONSTRAINT fk_accounts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS transactions (
  id           VARCHAR(64) NOT NULL,
  user_id      VARCHAR(128) NOT NULL,
  account_id   VARCHAR(64) NULL,                    -- SET NULL on account delete: tx survives
  type         ENUM('income','expense') NOT NULL,
  amount       DECIMAL(18,2) NOT NULL,
  currency     CHAR(3) NOT NULL,
  category     VARCHAR(64) NOT NULL,
  subcategory  VARCHAR(120) NULL,
  note         VARCHAR(500) NULL,
  date         BIGINT NOT NULL,
  scope        ENUM('personal','business') NOT NULL DEFAULT 'personal',
  created_at   BIGINT NOT NULL,
  updated_at   BIGINT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_tx_user_date (user_id, date),
  KEY idx_tx_account (account_id),
  KEY idx_tx_user_type (user_id, type),
  KEY idx_tx_user_category (user_id, category),
  CONSTRAINT fk_tx_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_tx_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS budgets (
  id          VARCHAR(64) NOT NULL,
  user_id     VARCHAR(128) NOT NULL,
  category    VARCHAR(64) NOT NULL,
  amount      DECIMAL(18,2) NOT NULL,
  currency    CHAR(3) NOT NULL,
  scope       ENUM('personal','business') NOT NULL DEFAULT 'personal',
  created_at  BIGINT NOT NULL,
  updated_at  BIGINT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_budgets_user (user_id),
  CONSTRAINT fk_budgets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS savings (
  id           VARCHAR(64) NOT NULL,
  user_id      VARCHAR(128) NOT NULL,
  name         VARCHAR(120) NOT NULL,
  target       DECIMAL(18,2) NOT NULL DEFAULT 0,
  current      DECIMAL(18,2) NOT NULL DEFAULT 0,
  currency     CHAR(3) NOT NULL,
  target_date  BIGINT NULL,
  scope        ENUM('personal','business') NOT NULL DEFAULT 'personal',
  created_at   BIGINT NOT NULL,
  updated_at   BIGINT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_savings_user (user_id),
  CONSTRAINT fk_savings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS investments (
  id             VARCHAR(64) NOT NULL,
  user_id        VARCHAR(128) NOT NULL,
  name           VARCHAR(120) NOT NULL,
  itype          VARCHAR(32) NOT NULL,
  quantity       DECIMAL(28,8) NOT NULL DEFAULT 0,
  buy_price      DECIMAL(28,8) NOT NULL DEFAULT 0,
  current_price  DECIMAL(28,8) NOT NULL DEFAULT 0,
  currency       CHAR(3) NOT NULL,
  scope          ENUM('personal','business') NOT NULL DEFAULT 'personal',
  created_at     BIGINT NOT NULL,
  updated_at     BIGINT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_investments_user (user_id),
  CONSTRAINT fk_investments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS transfers (
  id               VARCHAR(64) NOT NULL,
  user_id          VARCHAR(128) NOT NULL,
  from_account_id  VARCHAR(64) NULL,
  to_account_id    VARCHAR(64) NULL,
  amount           DECIMAL(18,2) NOT NULL,
  currency         CHAR(3) NOT NULL,
  date             BIGINT NOT NULL,
  note             VARCHAR(500) NULL,
  created_at       BIGINT NOT NULL,
  updated_at       BIGINT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_transfers_user (user_id),
  KEY idx_transfers_from (from_account_id),
  KEY idx_transfers_to (to_account_id),
  CONSTRAINT fk_transfers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_transfers_from FOREIGN KEY (from_account_id) REFERENCES accounts(id) ON DELETE SET NULL,
  CONSTRAINT fk_transfers_to FOREIGN KEY (to_account_id) REFERENCES accounts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Bills, subscriptions, reminders, tasks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
  id               VARCHAR(64) NOT NULL,
  user_id          VARCHAR(128) NOT NULL,
  name             VARCHAR(120) NOT NULL,
  price            DECIMAL(18,2) NOT NULL,
  currency         CHAR(3) NOT NULL,
  cycle            VARCHAR(16) NOT NULL,            -- monthly, yearly, weekly, ...
  next_billing_at  BIGINT NULL,
  category         VARCHAR(64) NULL,
  account_id       VARCHAR(64) NULL,
  notes            VARCHAR(500) NULL,
  status           ENUM('active','paused','cancelled') NOT NULL DEFAULT 'active',
  scope            ENUM('personal','business') NOT NULL DEFAULT 'personal',
  created_at       BIGINT NOT NULL,
  updated_at       BIGINT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_subs_user (user_id),
  KEY idx_subs_user_status (user_id, status),
  KEY idx_subs_next (next_billing_at),
  CONSTRAINT fk_subs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_subs_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
  id             VARCHAR(64) NOT NULL,
  user_id        VARCHAR(128) NOT NULL,
  name           VARCHAR(120) NOT NULL,
  amount         DECIMAL(18,2) NOT NULL,
  currency       CHAR(3) NOT NULL,
  due_at         BIGINT NOT NULL,
  category       VARCHAR(64) NULL,
  repeat_rule    VARCHAR(16) NOT NULL DEFAULT 'none',
  notes          VARCHAR(500) NULL,
  method         VARCHAR(64) NULL,
  reminder_days  INT NULL,
  status         ENUM('upcoming','paid','overdue') NOT NULL DEFAULT 'upcoming',
  paid_at        BIGINT NULL,
  scope          ENUM('personal','business') NOT NULL DEFAULT 'personal',
  created_at     BIGINT NOT NULL,
  updated_at     BIGINT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_payments_user (user_id),
  KEY idx_payments_user_status (user_id, status),
  KEY idx_payments_due (due_at),
  CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reminders (
  id            VARCHAR(64) NOT NULL,
  user_id       VARCHAR(128) NOT NULL,
  title         VARCHAR(200) NOT NULL,
  due_at        BIGINT NOT NULL,
  has_time      TINYINT(1) NOT NULL DEFAULT 0,
  notes         VARCHAR(500) NULL,
  category      VARCHAR(64) NULL,
  priority      VARCHAR(16) NULL,
  repeat_rule   VARCHAR(16) NOT NULL DEFAULT 'none',
  completed     TINYINT(1) NOT NULL DEFAULT 0,
  completed_at  BIGINT NULL,
  created_at    BIGINT NOT NULL,
  updated_at    BIGINT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_reminders_user (user_id),
  KEY idx_reminders_due (due_at),
  KEY idx_reminders_user_completed (user_id, completed),
  CONSTRAINT fk_reminders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tasks (
  id            VARCHAR(64) NOT NULL,
  user_id       VARCHAR(128) NOT NULL,
  title         VARCHAR(200) NOT NULL,
  status        VARCHAR(16) NOT NULL DEFAULT 'open',
  due_at        BIGINT NULL,
  notes         VARCHAR(500) NULL,
  created_at    BIGINT NOT NULL,
  updated_at    BIGINT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_tasks_user (user_id),
  CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Notifications & documents
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id          VARCHAR(64) NOT NULL,
  user_id     VARCHAR(128) NOT NULL,
  type        VARCHAR(48) NOT NULL,
  title       VARCHAR(200) NOT NULL,
  body        VARCHAR(500) NULL,
  data        JSON NULL,
  read_at     BIGINT NULL,                          -- NULL = unread
  created_at  BIGINT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_notif_user_created (user_id, created_at),
  KEY idx_notif_user_unread (user_id, read_at),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS documents (
  id           VARCHAR(64) NOT NULL,
  user_id      VARCHAR(128) NOT NULL,
  filename     VARCHAR(255) NOT NULL,
  mime_type    VARCHAR(128) NOT NULL,
  size_bytes   BIGINT NOT NULL DEFAULT 0,
  storage_key  VARCHAR(512) NOT NULL,               -- server path key under the private storage root
  metadata     JSON NULL,
  created_at   BIGINT NOT NULL,
  updated_at   BIGINT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_documents_user (user_id),
  CONSTRAINT fk_documents_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- MatriGuard dashboard: tables.
--
-- Run once in phpMyAdmin: select the database, open the SQL tab, paste
-- this file, press Go. Safe to run again; existing tables are left alone.
-- Works on MySQL 8 and MariaDB 10.6+ (what Hostinger provides).

CREATE TABLE IF NOT EXISTS posts (
  id               CHAR(36)          NOT NULL,
  slug             VARCHAR(90)       NOT NULL,
  title            VARCHAR(140)      NOT NULL,
  excerpt          VARCHAR(280)      NOT NULL DEFAULT '',
  category         VARCHAR(40)       NOT NULL DEFAULT '',
  -- /uploads/<name> for images in `media`, or a path on the website itself.
  cover_image      VARCHAR(255)      NULL,
  cover_alt        VARCHAR(160)      NOT NULL DEFAULT '',
  cover_position   VARCHAR(24)       NOT NULL DEFAULT 'center',
  -- Sanitised HTML from the editor.
  content_html     MEDIUMTEXT        NOT NULL,
  meta_description VARCHAR(160)      NOT NULL DEFAULT '',
  status           ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  -- The date printed on the article, India time. A published post dated
  -- in the future is scheduled: the public API hides it until that day.
  published_at     DATE              NOT NULL,
  reading_minutes  SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  -- UTC.
  created_at       DATETIME(3)       NOT NULL,
  updated_at       DATETIME(3)       NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY posts_slug (slug),
  KEY posts_public (status, published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Uploaded images. Kept in the database because a Node.js Web App's folder
-- can be replaced on redeploy. 16 MB per image at most; uploads are capped
-- at 5 MB by the app.
CREATE TABLE IF NOT EXISTS media (
  name        VARCHAR(64)  NOT NULL,
  mime        VARCHAR(32)  NOT NULL,
  size        INT UNSIGNED NOT NULL,
  bytes       MEDIUMBLOB   NOT NULL,
  created_at  DATETIME(3)  NOT NULL,
  PRIMARY KEY (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

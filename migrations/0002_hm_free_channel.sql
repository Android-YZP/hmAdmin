CREATE TABLE IF NOT EXISTS hm_free_channel (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  model TEXT NOT NULL,
  api_key TEXT NOT NULL,
  api_format TEXT NOT NULL DEFAULT 'openai_compat',
  request_path TEXT,
  headers_json TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  sort INTEGER NOT NULL DEFAULT 0,
  remark TEXT,
  create_time TEXT DEFAULT CURRENT_TIMESTAMP,
  update_time TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_hm_free_channel_enabled_sort ON hm_free_channel (enabled, sort, id);
CREATE INDEX IF NOT EXISTS idx_hm_free_channel_name ON hm_free_channel (name);

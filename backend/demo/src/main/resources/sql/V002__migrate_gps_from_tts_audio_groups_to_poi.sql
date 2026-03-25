-- =============================================================================
-- Migration: V002__migrate_gps_from_tts_audio_groups_to_poi
--
-- Mục tiêu:
--   1. Thêm cột GPS (latitude, longitude, accuracy, trigger_radius_meters, priority)
--      vào bảng pois (từ tts_audio_groups chuyển sang).
--   2. Copy dữ liệu GPS từ tts_audio_groups → pois (dựa trên pois.group_id).
--   3. Thêm cột poi_id vào bảng tts_audio_groups (FK ngược: N:1).
--   4. Bỏ cột GPS khỏi tts_audio_groups.
--
-- Thứ tự chạy: Nếu dùng Flyway/Liquibase, chạy V002 sau V001.
-- Nếu dùng Hibernate ddl-auto=update, chạy script này THỦ CÔNG trước
-- khi khởi động app để tránh mất dữ liệu.
-- =============================================================================

-- =============================================================================
-- BƯỚC 1: Thêm cột GPS vào bảng pois
-- =============================================================================
ALTER TABLE pois
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;

ALTER TABLE pois
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

ALTER TABLE pois
    ADD COLUMN IF NOT EXISTS accuracy REAL;

ALTER TABLE pois
    ADD COLUMN IF NOT EXISTS trigger_radius_meters REAL;

ALTER TABLE pois
    ADD COLUMN IF NOT EXISTS priority INTEGER;

-- =============================================================================
-- BƯỚC 2: Copy dữ liệu GPS từ tts_audio_groups sang pois
-- =============================================================================
UPDATE pois p
SET
    latitude          = g.latitude,
    longitude         = g.longitude,
    accuracy          = g.accuracy,
    trigger_radius_meters = g.trigger_radius_meters,
    priority          = g.priority
FROM tts_audio_groups g
WHERE p.group_id = g.id
  AND (
    g.latitude IS NOT NULL
    OR g.longitude IS NOT NULL
    OR g.accuracy IS NOT NULL
    OR g.trigger_radius_meters IS NOT NULL
    OR g.priority IS NOT NULL
  );

-- =============================================================================
-- BƯỚC 3: Thêm cột poi_id vào bảng tts_audio_groups
-- =============================================================================
ALTER TABLE tts_audio_groups
    ADD COLUMN IF NOT EXISTS poi_id BIGINT;

-- Tạo FK từ tts_audio_groups.poi_id → pois.id
ALTER TABLE tts_audio_groups
    ADD CONSTRAINT fk_tts_audio_groups_poi
    FOREIGN KEY (poi_id)
    REFERENCES pois(id)
    ON DELETE SET NULL;

-- =============================================================================
-- BƯỚC 4: Bỏ cột GPS khỏi tts_audio_groups
-- =============================================================================
ALTER TABLE tts_audio_groups
    DROP COLUMN IF EXISTS latitude;

ALTER TABLE tts_audio_groups
    DROP COLUMN IF EXISTS longitude;

ALTER TABLE tts_audio_groups
    DROP COLUMN IF EXISTS accuracy;

ALTER TABLE tts_audio_groups
    DROP COLUMN IF EXISTS trigger_radius_meters;

ALTER TABLE tts_audio_groups
    DROP COLUMN IF EXISTS priority;

-- =============================================================================
-- BƯỚC 5: Bỏ ràng buộc UNIQUE trên pois.group_id
--   (vì giờ là @ManyToOne — 1 POI gắn 1 group, nhưng 1 group có thể thuộc 1 POI)
--   Nếu muốn giữ 1-1, dùng câu dưới; nếu muốn cho phép 1 group → nhiều POI, bỏ comment.
-- =============================================================================
-- ALTER TABLE pois DROP CONSTRAINT IF EXISTS uk_pois_group_id;

-- =============================================================================
-- Verify
-- =============================================================================
SELECT 'pois columns after migration' AS info,
       column_name
FROM information_schema.columns
WHERE table_name = 'pois'
  AND column_name IN ('latitude','longitude','accuracy','trigger_radius_meters','priority')
ORDER BY column_name;

SELECT 'tts_audio_groups columns after migration' AS info,
       column_name
FROM information_schema.columns
WHERE table_name = 'tts_audio_groups'
  AND column_name IN ('latitude','longitude','accuracy','trigger_radius_meters','priority','poi_id')
ORDER BY column_name;

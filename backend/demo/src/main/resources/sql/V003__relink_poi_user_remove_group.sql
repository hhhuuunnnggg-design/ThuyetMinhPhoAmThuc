-- =============================================================================
-- Migration: V003__relink_poi_user_remove_group
--
-- Mục tiêu: Đảo chiều quan hệ POI <-> TTSAudioGroup
--   - Bỏ cột group_id khỏi bảng pois (POI không còn FK đến TTSAudioGroup).
--   - Thêm cột user_id vào bảng pois (User sở hữu POI).
--   - Bảng tts_audio_groups vẫn giữ poi_id (đã có từ V002).
--
-- Mô hình mới:
--   User (1) ──── (N) POI ──── (1) TTSAudioGroup
--                (POI chứa foodName, GPS, user)
--                (TTSAudioGroup chỉ chứa audio đa ngôn ngữ)
-- =============================================================================

-- =============================================================================
-- BƯỚC 1: Bỏ cột group_id khỏi bảng pois
-- =============================================================================
ALTER TABLE pois
    DROP COLUMN IF EXISTS group_id;

-- =============================================================================
-- BƯỚC 2: Thêm cột user_id vào bảng pois
-- =============================================================================
ALTER TABLE pois
    ADD COLUMN IF NOT EXISTS user_id BIGINT;

-- Tạo FK từ pois.user_id → users.id (cho phép NULL — POI có thể chưa gán user)
ALTER TABLE pois
    ADD CONSTRAINT fk_pois_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE SET NULL;

-- =============================================================================
-- BƯỚC 3: Thêm các cột thông tin ẩm thực vào bảng pois
--   (đã có từ V002 nếu chạy tuần tự; bỏ qua nếu trùng)
-- =============================================================================
ALTER TABLE pois
    ADD COLUMN IF NOT EXISTS food_name VARCHAR(255);

ALTER TABLE pois
    ADD COLUMN IF NOT EXISTS price DECIMAL(12, 2);

ALTER TABLE pois
    ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE pois
    ADD COLUMN IF NOT EXISTS image_url TEXT;

-- =============================================================================
-- Verify
-- =============================================================================
SELECT 'pois columns after V003' AS info,
       column_name,
       data_type
FROM information_schema.columns
WHERE table_name = 'pois'
ORDER BY column_name;

SELECT 'tts_audio_groups columns (poi_id should exist)' AS info,
       column_name
FROM information_schema.columns
WHERE table_name = 'tts_audio_groups'
  AND column_name = 'poi_id';

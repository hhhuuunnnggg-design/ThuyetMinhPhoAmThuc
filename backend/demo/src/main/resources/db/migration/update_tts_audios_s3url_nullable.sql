-- Migration script để cho phép s3Url có thể null
-- Chạy script này nếu Hibernate không tự động update schema

-- Kiểm tra và drop constraint nếu tồn tại (MySQL)
-- ALTER TABLE tts_audios MODIFY COLUMN s3url VARCHAR(500) NULL;

-- Hoặc với PostgreSQL
-- ALTER TABLE tts_audios ALTER COLUMN s3url DROP NOT NULL;

-- Lưu ý: Với spring.jpa.hibernate.ddl-auto=update, 
-- Hibernate sẽ tự động update schema khi restart application.
-- Chỉ cần chạy script này nếu muốn update thủ công.

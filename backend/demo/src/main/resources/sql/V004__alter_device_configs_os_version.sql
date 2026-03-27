-- V004__alter_device_configs_os_version.sql
-- os_version: chuỗi Android OS version thực tế rất dài (VD: "Android 14 - Build UP1A.231005.007")
ALTER TABLE device_configs
    MODIFY COLUMN os_version VARCHAR(100) NOT NULL DEFAULT '';

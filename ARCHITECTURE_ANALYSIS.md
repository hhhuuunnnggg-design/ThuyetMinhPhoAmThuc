# Đồ Án: Thuyết Minh Tự Động Phố Ẩm Thực
## Phân Tích Kiến Trúc & Thiết Kế Chi Tiết

---

## 1. PHÂN TÍCH 7 YÊU CẦU CỦA THẦY

### 1.1. Geofence - Nhiều POI trùng bán kính
**Vấn đề:** User đứng giữa 2 quán (2 POI có bán kính chồng lên nhau). Ưu tiên nghe cái nào?

**Giải pháp - Thuật toán ưu tiên 3 cấp:**
1. **Cấp 1 - Priority (ưu tiên cao nhất):** Mỗi POI có trường `priority` do admin cấu hình. Số càng lớn = ưu tiên càng cao.
2. **Cấp 2 - Khoảng cách (distance):** Nếu priority bằng nhau, POI gần hơn được ưu tiên.
3. **Cấp 3 - Khoảng cách tương đối:** Nếu khoảng cách gần bằng nhau (trong vòng 5m), ưu tiên POI có `triggerRadius` nhỏ hơn (vì user "sâu" hơn trong bán kính đó).

**Quy tắc xử lý:**
- Tìm tất cả POI trong bán kính → sắp xếp theo (priority DESC, distance ASC)
- Phát POI có điểm ưu tiên cao nhất
- Sau khi phát xong → cooldown 5 phút → mới phát POI tiếp theo trong danh sách
- Nếu user di chuyển ra khỏi bán kính rồi vào lại → reset cooldown

### 1.2. Kiểm tra cấu hình thiết bị (Device Config)
**Vấn đề:** App cần biết thiết bị đủ điều kiện chạy offline hay không.

**Giải pháp:**
- Entity `DeviceConfig`: lưu cấu hình mỗi thiết bị (RAM, storage, OS, network speed, last sync)
- Khi user mở app → gửi deviceInfo lên backend → backend trả về `mode: OFFLINE | STREAMING`
- **Offline mode:** thiết bị đủ RAM (≥4GB), storage ≥500MB, đã sync audio gần đây
- **Streaming mode:** thiết bị yếu, không đủ điều kiện offline

### 1.3. Hàng đợi (Queue) + Dashboard
**Vấn đề:** 1 quán có rất nhiều người → hiển thị dashboard ai đang nghe.

**Giải pháp:**
- Entity `QueueSession`: mỗi lần user bước vào bán kính POI → tạo 1 session
- Entity `ActiveNarration`: đang phát ngay lúc này (deviceId, audioId, startedAt, position)
- Dashboard admin: Real-time count theo POI (dùng polling 5s hoặc WebSocket)
- Bảng: POI | Đang nghe | Đã nghe hôm nay | Tổng

### 1.4. QR Code + App
**Luồng:**
1. User quét QR code (chứa POI ID hoặc groupKey)
2. App parse QR → gọi `/api/v1/app/pois/{id}` hoặc `/api/v1/app/pois?groupKey=X`
3. Hiển thị POI detail + nút "Nghe thuyết minh"
4. Nếu đã trong bán kính → tự động phát
5. Nếu ngoài bán kính → hiển thị khoảng cách + chỉ đường

### 1.5. PayOS Payment
**Giải pháp:**
- Entity `Payment`: lưu payment records (userId, POI owner, amount, status, payosTransactionId)
- Entity `Restaurant`: thông tin nhà hàng (owner, bank, PayOS info)
- Integration PayOS API:
  - Tạo payment link khi user thanh toán
  - Webhook nhận kết quả thanh toán
  - Admin xác nhận thanh toán thủ công nếu cần

### 1.6. Vị trí đang phát trên Frontend
**Giải pháp:**
- Khi backend nhận log phát → broadcast qua WebSocket hoặc polling
- Frontend web hiển thị:
  - Marker POI đang được phát (màu khác, icon khác, animation)
  - Bảng dashboard: POI | Số người đang nghe | Icon phát
  - Auto-scroll bảng khi có người mới

### 1.7. Offline Support
**Giải pháp:**
- Backend: API `/api/v1/app/pois/offline-bundle/{poiId}` trả về zip chứa audio + metadata
- Frontend app: download bundle khi vào bán kính (nếu chưa có)
- Lưu vào local storage với key = poiId + version
- Kiểm tra version: nếu audio mới hơn → tự động download lại
- Chế độ offline: phát từ local file, không cần gọi API

### 1.8. Load Test
**Giải pháp:**
- Endpoint `/api/v1/admin/load-test` để admin chạy simulation
- Cấu hình: số concurrent users, số POIs, thời gian chạy
- Trả về: throughput, latency p50/p95/p99, error rate
- DùngJMeter hoặc k6 script

### 1.9. Huấn luyện dịch thuật
**Giải pháp:**
- API để admin upload bilingual parallel corpus (Vietnamese ↔ target language)
- Backend fine-tune model translation hoặc cải thiện dictionary
- Dashboard: accuracy score, loss curve
- Manual correction interface

---

## 2. THIẾT KẾ DATABASE MỚI

### Entity mới cần tạo:

```
┌─────────────────┐     ┌─────────────────┐
│   TTSAudioGroup │────<│     POI         │  (1:1 hoặc 1:many - mỗi group = 1 POI)
│   (hiện có)     │     │  [NEW ENTITY]  │
└─────────────────┘     └────────┬────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐      ┌─────────────────┐      ┌──────────────────┐
│   Restaurant  │      │  ActiveNarration│      │  QueueSession    │
│  [NEW ENTITY] │      │  [NEW ENTITY]   │      │  [NEW ENTITY]    │
└───────────────┘      └─────────────────┘      └──────────────────┘
        │
        ▼
┌───────────────┐
│   Payment     │
│  [NEW ENTITY] │
└───────────────┘
```

### Chi tiết từng Entity:

#### 1. POI (Point of Interest) - Entity mới, mở rộng TTSAudioGroup
```java
- id: Long (PK)
- groupId: Long (FK → TTSAudioGroup) - 1:1
- address: String - Địa chỉ cụ thể
- category: String - Loại: "street_food", "restaurant", "cafe", "market"
- openHours: String - Giờ mở cửa
- phone: String - SĐT liên hệ
- isActive: Boolean - Còn hoạt động không
- viewCount: Long - Số lượt xem
- likeCount: Long - Số lượt thích
- qrCode: String - Mã QR (UUID)
- version: Integer - Version để sync offline
```

#### 2. Restaurant (Nhà hàng / Quán)
```java
- id: Long (PK)
- poiId: Long (FK → POI)
- ownerName: String - Tên chủ quán
- ownerEmail: String - Email chủ quán
- ownerPhone: String - SĐT chủ quán
- payosClientId: String - PayOS client ID
- payosApiKey: String - PayOS API key
- payosChecksumKey: String - PayOS checksum key
- bankAccount: String - STK ngân hàng
- bankName: String - Tên ngân hàng
- commissionRate: Float - % hoa hồng cho nền tảng
- isVerified: Boolean - Đã xác minh chưa
```

#### 3. DeviceConfig (Cấu hình thiết bị)
```java
- id: Long (PK)
- deviceId: String (unique) - Device identifier
- osVersion: String - Android/iOS version
- appVersion: String - Phiên bản app
- ramMB: Integer - RAM MB
- storageFreeMB: Integer - Storage trống MB
- networkType: String - wifi/4g/5g
- lastSyncAt: Instant - Lần sync cuối
- offlineModeEnabled: Boolean
- totalDownloadedMB: Long
- lastLat: Double
- lastLng: Double
- lastSeenAt: Instant
```

#### 4. ActiveNarration (Đang phát)
```java
- id: Long (PK)
- deviceId: String
- poiId: Long (FK → POI)
- audioId: Long (FK → TTSAudio)
- languageCode: String
- startedAt: Instant
- estimatedEndAt: Instant
- isCompleted: Boolean
- latitude: Double
- longitude: Double
```

#### 5. QueueSession (Phiên xếp hàng)
```java
- id: Long (PK)
- deviceId: String
- poiId: Long (FK → POI)
- enteredAt: Instant
- exitedAt: Instant (nullable)
- totalListeningTime: Long (seconds)
- audioCount: Integer - Số audio đã nghe trong session
- isPaid: Boolean
- paymentId: Long (FK → Payment, nullable)
```

#### 6. Payment (Thanh toán)
```java
- id: Long (PK)
- userId: String (deviceId hoặc userId)
- poiId: Long (FK → POI)
- restaurantId: Long (FK → Restaurant)
- amount: Long - Số tiền (VND)
- currency: String = "VND"
- status: String - PENDING/SUCCESS/FAILED/REFUNDED
- payosTransactionId: String
- payosPaymentLinkId: String
- payosPaymentLink: String
- qrCode: String - Mã QR thanh toán PayOS
- paidAt: Instant
- createdAt: Instant
- description: String
```

#### 7. TranslationTraining (Huấn luyện dịch thuật)
```java
- id: Long (PK)
- sourceLang: String
- targetLang: String
- sourceText: String
- targetText: String
- confidence: Float - Độ chính xác model đoán
- isValidated: Boolean - Đã được human verify chưa
- correctedText: String - Text đã sửa (nullable)
- trainedAt: Instant
- source: String - "manual" / "corpus" / "user_feedback"
```

#### 8. NarrationLog (mở rộng - đã có, thêm trường)
```java
Thêm:
- poiId: Long (FK → POI)
- queueSessionId: Long (FK → QueueSession)
- languageCode: String
- clientLat: Double
- clientLng: Double
```

---

## 3. API ENDPOINTS MỚI

### App Client APIs
```
GET  /api/v1/app/pois                          - Danh sách POI (đã có → mở rộng)
GET  /api/v1/app/pois/{id}                     - Chi tiết POI
GET  /api/v1/app/pois/nearby?lat=&lng=&radius=  - POI gần vị trí
GET  /api/v1/app/pois/qr/{qrCode}              - Tra cứu POI qua QR
GET  /api/v1/app/pois/{id}/audios              - Audio của POI (multilingual)
GET  /api/v1/app/pois/{id}/bundle              - Download offline bundle

POST /api/v1/app/device/register               - Đăng ký device + config
POST /api/v1/app/device/sync                   - Sync cấu hình thiết bị
GET  /api/v1/app/device/config                 - Lấy device config + mode

POST /api/v1/app/narration/check               - Check cooldown (đã có)
POST /api/v1/app/narration/start               - Bắt đầu phát → tạo QueueSession + ActiveNarration
POST /api/v1/app/narration/end                 - Kết thúc phát
POST /api/v1/app/narration/log                 - Ghi log (đã có)

GET  /api/v1/app/dashboard/nearby               - Dashboard POI gần đây (cho app)
GET  /api/v1/app/dashboard/active-count        - Số người đang nghe nearby

POST /api/v1/app/payment/create                - Tạo payment PayOS
GET  /api/v1/app/payment/{id}                 - Kiểm tra trạng thái
POST /api/v1/app/payment/webhook               - PayOS webhook
```

### Admin APIs
```
GET  /api/v1/admin/pois                        - Quản lý POI
POST /api/v1/admin/pois                        - Tạo POI
PUT  /api/v1/admin/pois/{id}                   - Cập nhật POI
DELETE /api/v1/admin/pois/{id}                 - Xóa POI
GET  /api/v1/admin/pois/{id}/stats             - Thống kê POI

GET  /api/v1/admin/restaurants                 - Quản lý nhà hàng
POST /api/v1/admin/restaurants                 - Tạo nhà hàng
PUT  /api/v1/admin/restaurants/{id}            - Cập nhật nhà hàng

GET  /api/v1/admin/queue                       - Dashboard queue real-time
GET  /api/v1/admin/queue/poi/{id}              - Queue của 1 POI

GET  /api/v1/admin/dashboard                   - Dashboard tổng quan
GET  /api/v1/admin/dashboard/active-narrations - Người đang nghe
GET  /api/v1/admin/dashboard/poi-activity      - Activity theo POI

POST /api/v1/admin/payments/{id}/approve       - Admin duyệt payment
POST /api/v1/admin/payments/{id}/reject       - Admin từ chối

GET  /api/v1/admin/translation/corpus          - Danh sách training data
POST /api/v1/admin/translation/corpus          - Upload training data
POST /api/v1/admin/translation/validate/{id}   - Validate/correct translation
GET  /api/v1/admin/translation/stats          - Translation accuracy stats

POST /api/v1/admin/load-test/start            - Bắt đầu load test
GET  /api/v1/admin/load-test/results           - Kết quả load test
```

---

## 4. CÔNG NGHỆ SỬ DỤNG

### Backend (đã có)
- Java Spring Boot 3.2.5
- MySQL
- Google Cloud TTS + Translate
- ViettelAI TTS
- AWS S3

### Frontend Web (đã có)
- React + Vite
- Ant Design 5
- Leaflet (maps)
- Redux Toolkit

### Mobile App (cần tạo)
- React Native (Expo)
- Axios
- React Navigation
- Expo Location (GPS)
- Expo Camera (QR Scanner)
- AsyncStorage (offline)
- Axios Interceptors

---

## 5. GIAO DIỆN MOBILE APP

### Screens:
1. **SplashScreen** - Logo, check device config
2. **HomeScreen** - Bản đồ + POI markers + bottom sheet
3. **POIDetailScreen** - Chi tiết POI, audio player, payment
4. **QRScannerScreen** - Quét QR code
5. **PaymentScreen** - Thanh toán PayOS
6. **ProfileScreen** - Cài đặt ngôn ngữ, offline mode
7. **HistoryScreen** - Lịch sử nghe

---

## 6. OFFLINE STRATEGY

### Bundle Structure (zip file):
```
poi-{id}-v{version}.zip
├── metadata.json          # POI info, audio list, version
├── audios/
│   ├── vi.mp3
│   ├── en.mp3
│   ├── zh.mp3
│   ├── ja.mp3
│   └── ko.mp3
├── image.jpg
└── checksum.json         # MD5/SHA256 để verify
```

### Sync Logic:
1. App gửi device config + last sync version
2. Backend trả về danh sách POI cần update (version mới hơn)
3. App download bundle cho từng POI (chỉ khi vào bán kính hoặc background sync)
4. Lưu vào app storage với key = `poi-{id}-v{version}`
5. Khi phát offline: kiểm tra checksum → phát từ local

---

## 7. LOAD TEST DESIGN

### Scenario:
- 100 concurrent users
- Mỗi user: random position → trigger 1-3 POI
- Mỗi narration: 30-60 giây
- Thời gian: 10 phút

### Metrics đo:
- Throughput: narrations/minute
- Latency: p50, p95, p99 (ms)
- Error rate: %
- DB connection pool usage
- Memory/CPU usage

### Implementation:
- Dùng JMeter hoặc k6 script
- Endpoint test: `/api/v1/app/narration/check` + `/api/v1/app/narration/log`
- Generate fake deviceIds + positions

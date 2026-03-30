# Sequence Diagram Review — So sánh biểu đồ vs Source code thực tế

> Cập nhật: 2026-03-28
>
> **Lưu ý:** Các ảnh biểu đồ được lưu trên GitHub user-attachments (Mermaid export), không thể fetch trực tiếp bằng code. Phân tích dưới đây dựa trên **tên biểu đồ trong `SequenceDiagram.md`** + **đối chiếu với source code backend** để xác nhận luồng nào đúng, thiếu, hoặc sai.

---

## Tổng quan

| Biểu đồ | File ảnh | Trạng thái |
|---|---|---|
| Đăng ký Tài khoản | `ab80e462...` | ✅ Đúng — có code tương ứng |
| Đăng xuất | `3fc54dd0...` | ✅ Đúng — có code tương ứng |
| Đăng nhập | `f2a43b78...` | ✅ Đúng — có code tương ứng |
| Đăng ký & Sync thiết bị | `481f5ddd...` | ⚠️ Cần tách — 2 luồng riêng |
| POI (Online / Offline) | `3a38e335...` | ⚠️ Thiếu luồng offline download |
| Quét QR → Chi tiết POI | `3e9735f8...` | ✅ Đúng — `GET /pois/qr/{qrCode}` |
| Phát thuyết minh | `07729c51...` | ⚠️ Thiếu bước geofence rank |
| Thanh toán | `2cf6eb07...` | ⚠️ Thiếu luồng webhook |
| Quản lý TTS Audio (Admin) | `b0899314...` | ✅ Đúng — `TTSController` |
| Dashboard Real-time (User) | `a59896dd...` | ✅ Đúng |
| Quản lý POI (Admin) | `d1a429c5...` | ✅ Đúng |
| Quản lý Quyền hệ thống | `dcfcb465...` | ✅ Đúng |
| Quản lý Vai trò & Phân quyền | `51a9c129...` | ✅ Đúng |
| Quản lý Người dùng | `321b5fb9...` | ✅ Đúng |
| Quản lý Nhà Hàng | `12e28750...` | ✅ Có biểu đồ — chưa xác nhận chi tiết |
| Dashboard Tổng quan & Thống kê | `ef3be30e...` | ⚠️ Thiếu 4 endpoint con |

---

## Chi tiết từng biểu đồ

---

### 1. Đăng ký / Đăng nhập / Đăng xuất

**File:** `AuthController.java`

```
POST /api/v1/auth/register     → tạo tài khoản mới (email + password + firstName + lastName)
POST /api/v1/auth/login        → xác thực → trả accessToken (JWT) + set refresh_token cookie
GET  /api/v1/auth/account      → lấy thông tin user hiện tại từ JWT
GET  /api/v1/auth/refresh      → refresh accessToken bằng refresh_token cookie
POST /api/v1/auth/logout       → xóa refresh_token, xóa cookie
GET  /api/v1/auth/social/login → redirect Google/Facebook OAuth
GET  /api/v1/auth/social/callback → OAuth callback → tạo/lưu user → redirect frontend kèm token
```

**✅ Trạng thái:** Đúng. Tất cả endpoints trên đều tồn tại trong code.

---

### 2. Đăng ký & Sync thiết bị ⚠️

**File:** `AppClientController.java` + `AppClientServiceImpl.java`

**Biểu đồ hiện tại:** Gộp chung thành 1 luồng "Đăng ký & Sync".

**Thực tế có 2 luồng riêng biệt:**

```
LUỒN A — Device Register (lần đầu mở app)
App  →  POST /api/v1/app/device/register
       Body: { deviceId, osVersion, appVersion, ramMB, storageFreeMB, networkType }
     →  Backend: DeviceConfigRepository.save()
     →  Trả về: { runningMode, offlineModeEnabled, poisNeedingSync }
     →  Logic: RAM≥4096 && Storage≥500MB → OFFLINE, else STREAMING

LUỒN B — Device Sync (định kỳ khi app chạy)
App  →  POST /api/v1/app/device/sync
       Body: { deviceId, latitude, longitude, downloadedVersions }
     →  Backend: cập nhật lastLat, lastLng, lastSyncAt
     →  Nếu OFFLINE → trả về poisNeedingSync (Map POI_id → version)
     →  Trả về: ResDeviceConfigDTO

LUỒN C — Check Running Mode
App  →  GET /api/v1/app/device/running-mode?deviceId=xxx
     →  Trả về: "OFFLINE" | "STREAMING"
```

**⚠️ Vấn đề:** Biểu đồ gộp 2 luồng → dễ gây hiểu nhầm. Nên tách thành:
- Biểu đồ 1: "Đăng ký thiết bị"
- Biểu đồ 2: "Sync thiết bị & Check Running Mode"

---

### 3. POI (Online / Offline) ⚠️

**Files:** `AppClientController.java`, `POIController.java`, `AppClientServiceImpl.java`

**Biểu đồ hiện tại:** Thể hiện luồng online (lấy POI nearby, hiển thị trên app).

**⚠️ Thiếu luồng offline:**

```
LUỒN OFFLINE — Download audio khi WiFi
App kiểm tra: runningMode = OFFLINE?
    ↓
App gọi: GET /api/v1/app/device/config → lấy poisNeedingSync
    ↓
Với mỗi POI cần sync:
App  →  GET /api/v1/tts/groups/{groupKey}/audio/{langCode}
     →  Backend trả file audio (.mp3)
     →  App lưu vào local storage
    ↓
Khi user bước vào vùng kích hoạt:
App  →  phát audio từ local storage
     →  KHÔNG gọi backend (offline mode)
```

**⚠️ Vấn đề:** Biểu đồ hiện tại chỉ có luồng online. Luồng offline (download + phát local) chưa được thể hiện.

---

### 4. Quét QR → Chi tiết POI

```
GET /api/v1/app/pois/qr/{qrCode}
```

**✅ Trạng thái:** Đúng. Endpoint tồn tại, gọi `appClientService.getPOIByQrCode(qrCode)`.

---

### 5. Phát thuyết minh ⚠️

**Files:** `AppClientController.java`, `AppClientServiceImpl.java`, `GeofenceService.java`

**Biểu đồ hiện tại:** Có thể chưa thể hiện bước **geofence rank**.

**Luồng đầy đủ theo code thực tế:**

```
1. App GPS liên tục → tính khoảng cách đến các POI nearby
   ↓
2. App check: distance <= triggerRadius?
   ↓
3. [THIẾU TRONG BIỂU ĐỒ] Nếu nhiều POI trong vùng:
   App/Backend rank POIs theo luật:
     a. Khoảng cách nhỏ nhất  →  ưu tiên trước  ← YẾU TỐ CHÍNH
     b. Cùng khoảng cách → Priority cao hơn  ← tie-breaker
     c. Cùng distance + priority → id nhỏ hơn  ← tie-breaker cuối
   ↓
4. App hiển thị thông báo "Bạn đang ở gần [TÊN POI ƯU TIÊN NHẤT]"
   ↓
5. App  →  POST /api/v1/app/narration/start
        Header: X-Device-Id
        Body: { poiId, audioId, languageCode, latitude, longitude }
     →  Backend ghi log geofence debug (console)
     →  Backend: tạo ActiveNarration(PLAYING)
     →  Trả về: 200 OK
   ↓
6. App phát audio (stream hoặc local)
   ↓
7. Khi xong / skip / hết phạm vi:
   App  →  POST /api/v1/app/narration/stop
        Body: { status: "COMPLETED" | "SKIPPED" | "EXPIRED" }
     →  Backend: ActiveNarration.expire() / .complete() / .skip()
```

**⚠️ Vấn đề:** Biểu đồ cần thêm bước **"Nếu nhiều POI → Rank theo khoảng cách → Priority"** (phản ánh đúng luật mới).

---

### 6. Thanh toán ⚠️

**Files:** `AppClientController.java`, `PayOSService.java`, `PayOSServiceImpl.java`, `AdminPaymentController.java`

**Luồng đầy đủ theo code thực tế:**

```
LUỒN A — Tạo thanh toán
App  →  POST /api/v1/app/payment/create
       Body: { poiId, userId, amount, description, quantity }
     →  Backend: PaymentRepository.save() (status = PENDING)
     →  Backend: PayOSService.createPaymentLink() → gọi PayOS API
     →  Trả về: { id, paymentLinkUrl, qrCodeUrl, status: PENDING }

LUỒN B — Webhook PayOS (THIẾU TRONG BIỂU ĐỒ)
PayOS  →  POST /api/v1/app/payment/webhook?transactionId=xxx&status=SUCCESS
       →  Backend: PayOSService.verifyWebhookSignature()
       →  Backend: cập nhật Payment → markSuccess() / markCancelled() / markFailed()

LUỒN C — Sync thủ công (Admin)
Admin  →  POST /api/v1/admin/payments/{id}/sync-payos
       →  Backend: PayOSService.fetchPaymentLink() → cập nhật trạng thái
```

**⚠️ Vấn đề:** Biểu đồ thanh toán có thể chưa thể hiện luồng **Webhook PayOS** gửi callback về backend.

---

### 7. Dashboard Tổng quan & Thống kê (Admin) ⚠️

**File:** `AdminDashboardController.java`

**Biểu đồ hiện tại:** Có 1 ảnh "Dashboard Tổng quan & Thống kê".

**⚠️ Thiếu — code có 7 endpoints dashboard con:**

| Endpoint | Mục đích |
|---|---|
| `GET /api/v1/admin/dashboard` | Tổng quan (POIs, devices, narration, payments) |
| `GET /api/v1/admin/dashboard/poi-queue` | POI queue real-time counts |
| `GET /api/v1/admin/dashboard/active-narrations` | Đang phát (admin/shop owner) |
| `GET /api/v1/admin/dashboard/top-pois` | Top POIs nghe nhiều nhất (theo ngày) |
| `GET /api/v1/admin/translation/stats` | Thống kê dịch thuật |
| `POST /api/v1/admin/load-test/start` | Load test (dev) |
| `GET /api/v1/admin/payments` | Danh sách thanh toán (phân trang, filter) |
| `GET /api/v1/admin/payments/stats/month` | Thống kê thanh toán tháng |
| `GET /api/v1/admin/narration-logs` | Narration log (phân trang) |

**⚠️ Vấn đề:** Biểu đồ "Dashboard Tổng quan" nên liệt kê rõ 7 endpoints này, hoặc tách thành nhiều biểu đồ nhỏ.

---

## Các endpoint CÓ TRONG CODE nhưng CHƯA CÓ biểu đồ

| Endpoint | Module | Ghi chú |
|---|---|---|
| `GET /api/v1/app/device/running-mode` | Device | Nên tách khỏi "Sync thiết bị" |
| `GET /api/v1/admin/payments/{id}/sync-payos` | Payment | Webhook + admin sync |
| `GET /api/v1/admin/dashboard/top-pois` | Dashboard | Thống kê top POIs |
| `GET /api/v1/admin/dashboard/poi-queue` | Dashboard | Real-time queue |
| `GET /api/v1/admin/translation/stats` | Dashboard | Translation stats |
| `POST /api/v1/admin/load-test/start` | Dashboard | Load test |
| `GET /api/v1/admin/narration-logs` | Admin | Narration log |
| `GET /api/v1/app/narration/log` | App | Client-side narration log |

---

## Đề xuất cập nhật biểu đồ

### Biểu đồ CẦN THÊM

```
1. [MỚI] "Sync thiết bị (Offline Mode)"
   — Thể hiện: check runningMode → download audio → phát local

2. [MỚI] "Thanh toán — Webhook"
   — PayOS gửi webhook → verify signature → update payment status

3. [MỚI] "Dashboard Admin — Chi tiết"
   — 7 endpoints con được gọi từ frontend dashboard
```

### Biểu đồ CẦN TÁCH

```
1. "Đăng ký & Sync thiết bị"
   → Tách: "Đăng ký thiết bị" (luồng 1)
   → Tách: "Sync thiết bị & Running Mode" (luồng 2)

2. "Dashboard Tổng quan & Thống kê"
   → Tách: "Dashboard Tổng quan" (biểu đồ chính)
   → Tách: "Dashboard — Top POIs & Narration Logs" (biểu đồ phụ)
```

### Biểu đồ CẦN CẬP NHẬT LUỒNG

```
1. "Phát thuyết minh"
   → Thêm bước: "Nếu nhiều POI trong vùng → Rank (distance → priority → id)"
   → Thêm bước: Backend log geofence debug (console)

2. "POI (Online / Offline)"
   → Thêm luồng offline: download audio → phát local (không gọi backend)
```

---

## Kết luận

| Loại | Số lượng |
|---|---|
| ✅ Đúng và khớp | 9 |
| ⚠️ Cần tách / cập nhật | 5 |
| ⚠️ Thiếu hoàn toàn (chưa có biểu đồ) | 3 |
| ❓ Không xác nhận được (ảnh không load) | 10 |

Ưu tiên cao nhất:
1. Cập nhật "Phát thuyết minh" — thêm bước geofence rank (luật mới: distance → priority)
2. Thêm "Thanh toán — Webhook PayOS"
3. Thêm "Sync thiết bị (Offline Mode)"

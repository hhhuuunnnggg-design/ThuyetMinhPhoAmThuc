# POI — Point of Interest

## 1. Cấu trúc dữ liệu POI

Mỗi POI là một **điểm ẩm thực** trên bản đồ, gắn với một hoặc nhiều audio thuyết minh đa ngôn ngữ.

```
POI (điểm trên bản đồ)
 ├── foodName        Tên món ăn
 ├── price           Giá
 ├── description     Mô tả chi tiết
 ├── imageUrl        Link ảnh món ăn
 ├── latitude        Vĩ độ (GPS)
 ├── longitude       Kinh độ (GPS)
 ├── accuracy        Độ chính xác GPS (mét)
 ├── triggerRadiusMeters   Bán kính kích hoạt (mét)
 ├── priority        Mức ưu tiên khi nhiều POI gần nhau
 ├── address         Địa chỉ
 ├── category        Loại: street_food | restaurant | cafe | market | hotel
 ├── openHours       Giờ mở cửa
 ├── phone           SĐT
 ├── isActive        Đang hoạt động hay không
 ├── viewCount       Số lượt xem
 ├── likeCount       Số lượt thích
 ├── qrCode          Mã QR (quét để mở POI)
 ├── version         Số version — tăng mỗi khi dữ liệu thay đổi (dùng cho sync offline)
 ├── restaurantId    Nhà hàng sở hữu
 ├── createdAt       Thời điểm tạo
 └── updatedAt       Thời điểm cập nhật cuối
```

### 2. Quan hệ

```
User  (người bán / chủ quán)
 └── POI  (1 → N)
      └── TTSAudioGroup  (1 → N)   ← nhóm audio thuyết minh POI này
           └── TTSAudio  (1 → N, mỗi 1 bản audio = 1 ngôn ngữ)
                ├── langCode  vi | en | zh | ja | ko | fr
                ├── s3Url     link file MP3 trên S3
                ├── fileSize  kích thước file
                └── duration  độ dài (giây)
```

### 3. API Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/v1/app/pois` | Lấy tất cả POI |
| `GET` | `/api/v1/app/pois/nearby?lat=&lng=&radiusKm=` | Lấy POI gần vị trí |
| `GET` | `/api/v1/app/pois/{id}` | Lấy chi tiết 1 POI |
| `GET` | `/api/v1/app/pois/qr/{qrCode}` | Quét QR → lấy POI |

### 4. Trigger (Kích hoạt thuyết minh)

#### 4.1. Khi nào POI được kích hoạt?

User đi vào **bán kính kích hoạt** (`triggerRadiusMeters`) của POI.

```
User đứng ở (lat, lng)
  │
  │  distance = haversine(user, POI)
  │
  ▼
distance <= triggerRadiusMeters  →  KÍCH HOẠT ✅
distance >  triggerRadiusMeters  →  BÌNH THƯỜNG
```

Mặc định: `triggerRadiusMeters = 50m`

#### 4.2. Khi nào POI hiện trong danh sách?

POI chỉ hiện trong danh sách khi nằm trong bán kính **hiển thị** (`NEARBY_RADIUS_KM`).

Mặc định: `NEARBY_RADIUS_KM = 2.0km` (trong `APP_CONFIG`)

#### 4.3. Khi nào user nghe được thuyết minh?

```
Bước 1: User đi vào triggerRadius → POI được kích hoạt
Bước 2: autoGuide = true (mặc định) → Tự phát audio
         autoGuide = false           → Chỉ hiện POI, KHÔNG phát
Bước 3: Ưu tiên ngôn ngữ preferredLang (mặc định: vi = tiếng Việt)
Bước 4: Kiểm tra offline:
         - SQLite có audio local → phát từ file (không cần mạng)
         - Không có → gọi API → stream từ S3
```

### 5. Xử lý khi nhiều POI cùng trigger

#### 5.1. Luật ưu tiên 3 cấp (Backend + App Mobile)

```
1. Có trong trigger radius?    →  chỉ POI nào isInside mới được xét
2. Khoảng cách nhỏ nhất       →  yếu tố CHÍNH quyết định thắng cuộc
3. Priority cao hơn            →  tie-breaker khi khoảng cách bằng nhau
4. id nhỏ hơn                 →  tie-breaker cuối cùng (đảm bảo thứ tự ổn định)
```

#### 5.2. Ví dụ

**Cùng priority, khác khoảng cách:**
```
POI A: priority = 5,  distance = 45m,  radius = 50m
POI B: priority = 5,  distance = 20m,  radius = 30m

→ A.isInside = (45 ≤ 50) = true
→ B.isInside = (20 ≤ 30) = true

→ A: sortDist=45, sortPriority=5
→ B: sortDist=20, sortPriority=5

→ B thắng (20m < 45m)  ← khoảng cách là yếu tố quyết định
```

**Khác priority, cùng khoảng cách:**
```
POI A: priority = 10, distance = 50m, radius = 50m
POI B: priority = 1,  distance = 50m, radius = 50m

→ A.isInside = true, B.isInside = true

→ A: sortDist=50, sortPriority=10
→ B: sortDist=50, sortPriority=1

→ A thắng (cùng distance → priority cao hơn)
```

**Khác priority, khác khoảng cách:**
```
POI A: priority = 10, distance = 45m, radius = 50m
POI B: priority = 1,  distance = 20m, radius = 30m

→ B thắng (20m < 45m, dù priority thấp hơn nhiều)
```

> **Nguyên tắc thiết kế:** Khoảng cách phản ánh vị trí vật lý — đứng gần quán nào thì nghe quán đó là tự nhiên nhất. Priority chỉ phân định khi khoảng cách không quyết định được (hai quán cách xa tương đương).

### 6. Cooldown (Tránh phát lặp)

Sau khi phát xong 1 POI, phải **đợi 5 phút** mới phát lại POI đó.

```
COOLDOWN_MS = 5 × 60 × 1000 = 300_000 ms

canPlay(poiId):
  if chưa phát bao giờ → ✅ phát
  if đã phát và chưa đủ 5 phút → ❌ không phát
  if đã phát và >= 5 phút rồi → ✅ phát lại
```

### 7. Sync Offline

- Khi app mở: kiểm tra RAM ≥ 4GB → **tự bật offline** → **tự sync**
- Sync: tải toàn bộ POI + metadata audio + file MP3 về máy
- Dữ liệu lưu vào:
  - **SQLite** (`offline_poi.db`) — metadata POI + audio
  - **File system** (`Documents/offline/audio/`) — file MP3
- `version` của POI dùng để kiểm tra POI nào cần cập nhật (chỉ sync lại POI thay đổi)

### 8. Thứ tự ưu tiên TỔNG HỢP

```
1. POI nào CÓ ĐỦ ĐIỀU KIỆN trigger (trong bán kính)?
   │
   ├── Khoảng cách nhỏ nhất  →  phát trước  (yếu tố CHÍNH)
   │
   ├── Cùng khoảng cách →  priority cao hơn  →  phát trước  (tie-breaker 1)
   │
   └── Cùng khoảng cách + priority  →  id nhỏ hơn  →  phát trước  (tie-breaker cuối)
```

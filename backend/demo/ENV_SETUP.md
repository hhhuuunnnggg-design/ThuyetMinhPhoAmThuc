# Hướng dẫn sử dụng Biến Môi Trường

## Cấu hình

Ứng dụng Spring Boot đã được cấu hình để sử dụng biến môi trường. Tất cả các giá trị nhạy cảm đã được chuyển sang sử dụng biến môi trường với giá trị mặc định.

## Các biến môi trường có sẵn

### Database Configuration
- `DB_URL`: URL kết nối database (mặc định: `jdbc:mysql://localhost:3306/hung123`)
- `DB_USERNAME`: Tên người dùng database (mặc định: `root`)
- `DB_PASSWORD`: Mật khẩu database (mặc định: `123456`)

### JPA Configuration
- `JPA_DDL_AUTO`: Chế độ DDL của Hibernate (mặc định: `update`)
- `JPA_SHOW_SQL`: Hiển thị SQL queries (mặc định: `true`)

### Server Configuration
- `SERVER_PORT`: Port của server (mặc định: `8080`)

### JWT Configuration
- `JWT_SECRET`: Secret key cho JWT (mặc định: giá trị hiện tại)
- `JWT_ACCESS_TOKEN_VALIDITY`: Thời gian hết hạn của access token (giây) (mặc định: `300`)
- `JWT_REFRESH_TOKEN_VALIDITY`: Thời gian hết hạn của refresh token (giây) (mặc định: `8640000`)

## Cách sử dụng

### Cách 1: Thiết lập biến môi trường trong hệ thống

#### Windows (CMD)
```cmd
set DB_PASSWORD=your_password
set JWT_SECRET=your_secret_key
```

#### Windows (PowerShell)
```powershell
$env:DB_PASSWORD="your_password"
$env:JWT_SECRET="your_secret_key"
```

#### Linux/Mac
```bash
export DB_PASSWORD=your_password
export JWT_SECRET=your_secret_key
```

### Cách 2: Sử dụng file .env (khuyến nghị)

1. Tạo file `.env` trong thư mục `backend/demo/`
2. Thêm các biến môi trường vào file:

```env
# Database Configuration
DB_URL=jdbc:mysql://localhost:3306/hung123
DB_USERNAME=root
DB_PASSWORD=your_password

# JPA Configuration
JPA_DDL_AUTO=update
JPA_SHOW_SQL=true

# Server Configuration
SERVER_PORT=8080

# JWT Configuration
JWT_SECRET=your_secret_key_here
JWT_ACCESS_TOKEN_VALIDITY=300
JWT_REFRESH_TOKEN_VALIDITY=8640000
```

3. Để Spring Boot đọc file `.env`, bạn có thể:
   - Sử dụng plugin như `dotenv-java` (cần thêm dependency)
   - Hoặc sử dụng IDE để load file `.env` khi chạy

### Cách 3: Chạy với biến môi trường trực tiếp

#### Windows (CMD)
```cmd
set DB_PASSWORD=your_password && mvn spring-boot:run
```

#### Windows (PowerShell)
```powershell
$env:DB_PASSWORD="your_password"; mvn spring-boot:run
```

#### Linux/Mac
```bash
DB_PASSWORD=your_password mvn spring-boot:run
```

### Cách 4: Sử dụng với Docker

Khi chạy Docker container, truyền biến môi trường:

```bash
docker run -e DB_PASSWORD=your_password -e JWT_SECRET=your_secret app.jar
```

Hoặc sử dụng file `.env`:
```bash
docker run --env-file .env app.jar
```

## Lưu ý

- File `.env` đã được thêm vào `.gitignore` để không commit lên Git
- Luôn sử dụng giá trị mặc định an toàn trong môi trường development
- Thay đổi tất cả giá trị mặc định trong môi trường production
- Không chia sẻ file `.env` chứa thông tin nhạy cảm

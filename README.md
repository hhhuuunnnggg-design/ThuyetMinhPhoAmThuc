
- 🔐 Đăng nhập / Đăng ký (JWT + Spring Security)
- 🚫 Chặn truy cập trái phép & redirect về trang đăng nhập
- 🔑 Tự động gắn token khi gọi API từ frontend bằng Axios interceptor
- ⚙️ Phân quyền động theo vai trò (Admin/User)
- 🌐 API mô tả bằng Swagger OpenAPI

---

## 🛠️ Công nghệ sử dụng

### 🔙 Backend (Spring Boot)

- ☕ **Java 17**, **Spring Boot 3.2.5**
- 🔐 Spring Security + JWT
- 🧠 AI Bot API
- 🗃️ Spring Data JPA (MySQL)
- 🧪 Hibernate Validator
- 🧾 Swagger OpenAPI (Tài liệu API)

### 🎨 Frontend (React + Vite + TypeScript)

- ⚛️ React 18 + Vite
- 🧑‍🎨 Ant Design UI
- 🧭 React Router DOM
- 📦 Axios (REST client)
- 🌍 Redux Toolkit (quản lý trạng thái)

---

## ⚙️ Cấu trúc cổng dịch vụ

| Thành phần | Công nghệ   | Cổng   |
| ---------- | ----------- | ------ |
| Backend    | Spring Boot | `8080` |
| Frontend   | React Vite  | `3001` |

---

## 🚀 Hướng dẫn chạy project

### ✅ 1. Chạy Backend

```bash
# Di chuyển vào thư mục backend
cd backend

# Build project
./mvnw clean install

# Chạy ứng dụng
./mvnw spring-boot:run
```

### ✅ 2. Chạy Frontend

```bash
# Di chuyển vào thư mục frontend

cd front_end/01-react-vite-starter

# Cài đặt thư viện

npm install

# Chạy Vite dev server

npm run dev
```

### ✅ 3. Thông tin hỗ trợ

```bash
# 🔑 Tài khoản admin
- email:admin@gmail.com
- password:123456

# 🌐API mẫu (Swagger)

- Truy cập tài liệu Swagger UI tại:
- 👉http://localhost:8080/swagger-ui/index.html

# 👨‍💻 Liên hệ

- Email:nguyendinhhungtc2020@gmail.com
```

### ✅ 4. Chạy docker

```bash
# Dừng và xóa container cũ
docker-compose down


# Build lại image và chạy lên
docker-compose up --build -d


# Các port trong đây
frontend: 3001
backend:8080
gui phpmyadmin: 8082
```




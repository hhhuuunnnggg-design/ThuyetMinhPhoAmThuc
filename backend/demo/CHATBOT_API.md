# Chatbot API Documentation

## Tổng quan

API Chatbot cho phép người dùng tương tác với AI thông qua tin nhắn. Hệ thống hỗ trợ lưu trữ lịch sử chat và tích hợp với OpenAI API.

## Base URL

```
http://localhost:8080/api/chatbot
```

## Endpoints

### 1. Gửi tin nhắn và nhận phản hồi từ AI

**POST** `/send-message`

Gửi tin nhắn từ người dùng và nhận phản hồi tự động từ AI.

**Request Body:**

```json
{
  "userId": 1,
  "message": "Xin chào, bạn có thể giúp tôi không?"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Message processed successfully",
  "data": {
    "id": 123,
    "content": "Xin chào! Tôi rất vui được giúp bạn. Bạn cần hỗ trợ gì?",
    "isBot": true,
    "timestamp": "2025-01-13 10:30:00"
  }
}
```

### 2. Lưu tin nhắn người dùng

**POST** `/save-user-message`

Lưu tin nhắn từ người dùng vào database.

**Request Body:**

```json
{
  "userId": 1,
  "message": "Tin nhắn từ người dùng"
}
```

### 3. Lưu tin nhắn bot

**POST** `/save-bot-message`

Lưu tin nhắn từ bot vào database.

**Request Body:**

```json
{
  "userId": 1,
  "message": "Phản hồi từ bot"
}
```

### 4. Lấy lịch sử chat

**GET** `/history/{userId}`

Lấy toàn bộ lịch sử chat của một người dùng.

**Response:**

```json
{
  "status": "success",
  "message": "Chat history fetched successfully",
  "data": [
    {
      "id": 1,
      "content": "Xin chào",
      "isBot": false,
      "timestamp": "2025-01-13 10:30:00"
    },
    {
      "id": 2,
      "content": "Xin chào! Tôi có thể giúp gì cho bạn?",
      "isBot": true,
      "timestamp": "2025-01-13 10:30:05"
    }
  ]
}
```

### 5. Lấy tin nhắn gần đây

**GET** `/recent/{userId}?limit=10`

Lấy n tin nhắn gần nhất của một người dùng.

**Parameters:**

- `limit` (optional): Số lượng tin nhắn tối đa (default: 10)

### 6. Xóa lịch sử chat

**DELETE** `/history/{userId}`

Xóa toàn bộ lịch sử chat của một người dùng.

**Response:**

```json
{
  "status": "success",
  "message": "Chat history cleared successfully",
  "data": null
}
```

## Error Responses

### 400 Bad Request

```json
{
  "status": "error",
  "message": "User ID is required",
  "data": null
}
```

### 404 Not Found

```json
{
  "status": "error",
  "message": "User not found",
  "data": null
}
```

### 500 Internal Server Error

```json
{
  "status": "error",
  "message": "Internal server error: [error details]",
  "data": null
}
```

## Cấu hình

### OpenAI Configuration

Trong `application.properties`:

```properties
openai.api.key=your_openai_api_key
openai.model=gpt-4o-mini
openai.temperature=0.7
openai.max-tokens=1024
```

### Gemini Configuration (Backup)

```properties
gemini.api.key=your_gemini_api_key
gemini.api.url=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent
gemini.model=gemini-2.5-flash-preview-04-17
```

## Database Schema

### ChatbotMessage Table

```sql
CREATE TABLE chatbot_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    is_bot BOOLEAN NOT NULL,
    timestamp DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Testing

### Test với cURL

1. **Gửi tin nhắn:**

```bash
curl -X POST http://localhost:8080/api/chatbot/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "message": "Xin chào"
  }'
```

2. **Lấy lịch sử chat:**

```bash
curl -X GET http://localhost:8080/api/chatbot/history/1
```

3. **Xóa lịch sử chat:**

```bash
curl -X DELETE http://localhost:8080/api/chatbot/history/1
```

## Lưu ý

1. **User Authentication**: Đảm bảo user tồn tại trong database trước khi sử dụng API
2. **Rate Limiting**: Có thể thêm rate limiting để tránh spam
3. **Message Length**: Tin nhắn không được để trống
4. **AI Response**: Hệ thống sẽ tự động lưu cả tin nhắn người dùng và phản hồi AI
5. **Error Handling**: Tất cả lỗi đều được xử lý và trả về response phù hợp

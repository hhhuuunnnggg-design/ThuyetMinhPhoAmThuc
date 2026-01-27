#!/bin/bash

# Script deploy tự động cho dự án
# Sử dụng: ./deploy.sh [dev|prod]

set -e

ENV=${1:-dev}

echo "🚀 Bắt đầu deploy ở môi trường: $ENV"

# Kiểm tra Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker chưa được cài đặt. Vui lòng cài đặt Docker trước."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose chưa được cài đặt. Vui lòng cài đặt Docker Compose trước."
    exit 1
fi

# Kiểm tra file .env
if [ ! -f .env ]; then
    echo "⚠️  File .env không tồn tại. Đang tạo từ env.example..."
    if [ -f env.example ]; then
        cp env.example .env
        echo "✅ Đã tạo file .env. Vui lòng chỉnh sửa các giá trị cần thiết."
        echo "📝 Sau đó chạy lại script này."
        exit 1
    else
        echo "❌ File env.example không tồn tại."
        exit 1
    fi
fi

# Pull images mới nhất (nếu có)
if [ "$ENV" = "prod" ]; then
    echo "📦 Đang pull images mới nhất..."
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml pull || true
fi

# Build images
echo "🔨 Đang build images..."
if [ "$ENV" = "prod" ]; then
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
else
    docker-compose build
fi

# Dừng containers cũ
echo "🛑 Dừng containers cũ..."
if [ "$ENV" = "prod" ]; then
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
else
    docker-compose down
fi

# Khởi động containers mới
echo "▶️  Khởi động containers..."
if [ "$ENV" = "prod" ]; then
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
else
    docker-compose up -d
fi

# Đợi services khởi động
echo "⏳ Đợi services khởi động..."
sleep 10

# Kiểm tra health
echo "🏥 Kiểm tra health của services..."
docker-compose ps

echo "✅ Deploy hoàn tất!"
echo ""
echo "📊 Services:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend:  http://localhost:8080"
echo "  - API Docs: http://localhost:8080/swagger-ui.html"
echo ""
echo "📝 Xem logs: docker-compose logs -f"
echo "🛑 Dừng: docker-compose down"

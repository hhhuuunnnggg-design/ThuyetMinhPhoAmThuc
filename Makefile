.PHONY: help build up down logs restart clean test

help: ## Hiển thị help message
	@echo "Các lệnh có sẵn:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Build tất cả Docker images
	docker-compose build

up: ## Khởi động tất cả services
	docker-compose up -d

down: ## Dừng tất cả services
	docker-compose down

logs: ## Xem logs của tất cả services
	docker-compose logs -f

restart: ## Restart tất cả services
	docker-compose restart

clean: ## Dừng và xóa tất cả containers, volumes
	docker-compose down -v

test: ## Chạy tests
	cd backend/demo && mvn test
	cd front_end/01-react-vite-starter && npm test || true

build-backend: ## Build backend image
	cd backend/demo && docker build -t auth-backend:latest .

build-frontend: ## Build frontend image
	cd front_end/01-react-vite-starter && docker build -t auth-frontend:latest --build-arg VITE_BACKEND_URL=http://localhost:8080 .

prod-up: ## Khởi động production mode
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

prod-down: ## Dừng production mode
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

prod-logs: ## Xem logs production
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

db-backup: ## Backup database
	docker exec auth-mysql mysqldump -u root -p$(shell grep DB_ROOT_PASSWORD .env | cut -d '=' -f2) authdb > backup_$(shell date +%Y%m%d_%H%M%S).sql

db-restore: ## Restore database (sử dụng: make db-restore FILE=backup.sql)
	docker exec -i auth-mysql mysql -u root -p$(shell grep DB_ROOT_PASSWORD .env | cut -d '=' -f2) authdb < $(FILE)

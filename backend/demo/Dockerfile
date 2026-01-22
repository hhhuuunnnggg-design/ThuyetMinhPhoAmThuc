# Multi-stage build để tối ưu kích thước image
FROM maven:3.9.6-eclipse-temurin-17 AS builder

WORKDIR /app

# Copy pom.xml và download dependencies (cache layer)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code và build
COPY src ./src
RUN mvn clean package -DskipTests -B

# Runtime stage
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Cài wget cho health check
RUN apk add --no-cache wget

# Tạo user non-root để chạy ứng dụng (bảo mật)
RUN addgroup -S spring && adduser -S spring -G spring

# Copy JAR từ builder stage
COPY --from=builder /app/target/*.jar app.jar

# Chuyển ownership cho user spring
RUN chown spring:spring app.jar

# Chuyển sang user spring
USER spring

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Run application
ENTRYPOINT ["java", "-jar", "app.jar"]

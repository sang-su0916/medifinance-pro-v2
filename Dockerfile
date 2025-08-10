# MediFinance Pro v2 Docker Image
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 패키지 설치
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# 백엔드 설정
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install --production

# 프론트엔드 설정
WORKDIR /app
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm install --production && npm run build

# 소스 코드 복사
WORKDIR /app
COPY backend/ ./backend/
COPY frontend/build/ ./frontend/build/

# 포트 노출
EXPOSE 3001

# 헬스체크
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# 백엔드 서버만 실행 (프론트엔드는 빌드된 정적 파일 서빙)
WORKDIR /app/backend
CMD ["npm", "start"]
# MediFinance Pro v2 설치 가이드

## 📋 시스템 요구사항

### 필수 프로그램
- **Node.js 18+**: [https://nodejs.org/](https://nodejs.org/) 에서 다운로드
- **npm**: Node.js와 함께 자동 설치됨
- **Git**: [https://git-scm.com/](https://git-scm.com/) 에서 다운로드

### 권장 시스템
- **메모리**: 8GB 이상 RAM
- **저장공간**: 1GB 이상 여유 공간
- **운영체제**: Windows 10+, macOS 10.15+, Ubuntu 20.04+

## 🔧 설치 방법

### 1단계: 프로젝트 다운로드
```bash
# GitHub에서 프로젝트 다운로드 (또는 ZIP 파일 다운로드)
git clone https://github.com/your-repo/medifinance-pro-v2.git
cd medifinance-pro-v2
```

### 2단계: 백엔드 설정
```bash
# 백엔드 디렉토리로 이동
cd backend

# 패키지 설치
npm install

# 서버 시작
npm start
```

### 3단계: 프론트엔드 설정
```bash
# 새 터미널에서 프론트엔드 디렉토리로 이동
cd frontend

# 패키지 설치
npm install

# 개발 서버 시작
npm start
```

## 🌐 사용 방법

1. **백엔드 서버**: http://localhost:3001 에서 실행
2. **프론트엔드 UI**: http://localhost:3000 에서 접속
3. **Excel 파일 업로드**: 웹 인터페이스에서 파일 드래그 & 드롭

## 📁 파일 구조
```
medifinance-pro-v2/
├── backend/          # Node.js 서버
│   ├── src/         # 소스코드
│   ├── package.json # 백엔드 의존성
│   └── README.md
├── frontend/         # React 웹앱
│   ├── src/         # React 소스코드
│   ├── package.json # 프론트엔드 의존성
│   └── public/
├── sample_files/     # 샘플 Excel 파일들
└── INSTALLATION.md   # 이 파일
```

## 🛠️ 문제 해결

### 포트 충돌 문제
```bash
# 다른 포트로 실행
# 백엔드
PORT=3002 npm start

# 프론트엔드
PORT=3001 npm start
```

### 패키지 설치 오류
```bash
# npm 캐시 초기화
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Excel 파일 처리 오류
- Excel 파일이 열려있으면 닫아주세요
- 파일 경로에 한글이 포함된 경우 영문 경로로 변경해보세요

## 📞 지원
- 문제 발생시: [이슈 등록](https://github.com/your-repo/issues)
- 사용법 문의: [Wiki 페이지](https://github.com/your-repo/wiki)
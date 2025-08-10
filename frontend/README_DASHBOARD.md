# MediFinance Pro v2 - 웹 대시보드

병원 재무 자동화 시스템의 React + TypeScript 웹 대시보드

## 🚀 주요 기능

### 실시간 진행률 표시
- 📁 로우데이터 업로드 → 📊 분류 진행률 (실시간) → ⚡ 계산 진행률 (실시간)
- "643건 중 573건 분류 완료... (89.11% 정확도)"

### 분류 결과 대시보드
```
💰 계정과목별 집계
├── 건보수익: ₩573,000,000 (573건)
├── 의보수익: ₩0 (0건)  
└── 총 수익: ₩573,000,000 (573건)

📈 분류 정확도: 89.11% (자동), 10.89% (검토필요)
```

## 🛠 기술 스택

- **Frontend**: React 18, TypeScript
- **UI Components**: Custom components with Tailwind CSS
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Styling**: Tailwind CSS
- **Real-time**: Server-Sent Events (SSE)

## 📦 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 백엔드 서버 실행
```bash
cd ../backend
node src/index.js
```

### 3. 프론트엔드 실행
```bash
npm start
```

브라우저에서 `http://localhost:3000` 접속
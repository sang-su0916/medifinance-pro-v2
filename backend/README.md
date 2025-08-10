# MediFinance Pro v2 Backend

병원 재무 데이터 자동화 시스템의 백엔드 API 서버

## 🎯 주요 기능

### 핵심 엔진
- **계정과목 자동 분류 엔진**: AI 기반으로 거래내역을 24개 계정과목으로 자동 분류
- **SUMIFS 계산 엔진**: Excel의 456개 SUMIFS 패턴을 JavaScript로 완전 재현
- **데이터 플로우 관리자**: 시트간 의존성 처리 및 실시간 업데이트 관리

### 지원 기능
- **Excel 서비스**: Excel 파일 분석, 수식 추출, 리포트 생성
- **검증 서비스**: Excel과 시스템 결과 비교, 정확도 측정
- **수식 파서**: Excel 수식을 JavaScript로 변환 및 실행

## 🏗️ 시스템 아키텍처

```
backend/
├── src/
│   ├── engines/           # 핵심 엔진들
│   │   ├── ClassificationEngine.js    # 계정과목 자동 분류
│   │   ├── CalculationEngine.js       # SUMIFS 계산 엔진
│   │   └── DataFlowManager.js         # 데이터 플로우 관리
│   ├── models/           # 데이터 모델
│   │   ├── Transaction.js             # 거래내역 모델
│   │   └── AccountSubject.js          # 계정과목 모델
│   ├── services/         # 서비스 레이어
│   │   ├── ExcelService.js            # Excel 처리
│   │   └── ValidationService.js       # 결과 검증
│   ├── utils/           # 유틸리티
│   │   ├── FormulaParser.js          # Excel 수식 파서
│   │   └── DataProcessor.js          # 데이터 처리
│   └── index.js         # 메인 애플리케이션
└── tests/              # 테스트 케이스
```

## 🚀 빠른 시작

### 1. 의존성 설치

```bash
cd backend
npm install
```

### 2. 서버 실행

```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

### 3. 서버 상태 확인

```bash
curl http://localhost:3001/health
```

## 📊 API 엔드포인트

### 기본 정보
- `GET /health` - 서버 상태 확인
- `GET /api/info` - API 정보 조회

### 계정 분류 API
- `POST /api/classification/classify` - 거래내역 배열 자동 분류
- `POST /api/classification/classify-single` - 단일 거래내역 분류
- `GET /api/classification/rules` - 분류 규칙 조회

### 계산 엔진 API
- `POST /api/calculation/execute` - 수식 배열 실행
- `POST /api/calculation/execute-formula` - 단일 수식 실행

### 데이터 플로우 API
- `POST /api/dataflow/execute` - 전체 데이터 플로우 실행
- `GET /api/dataflow/progress/:sessionId` - 실시간 진행률 조회

### Excel 서비스 API
- `POST /api/excel/analyze` - Excel 파일 분석
- `POST /api/excel/parse-raw-data` - 로우 데이터 파싱
- `POST /api/excel/create-report` - Excel 리포트 생성

### 검증 서비스 API
- `POST /api/validation/validate` - 결과 검증
- `GET /api/validation/history` - 검증 이력 조회
- `GET /api/validation/trend` - 정확도 트렌드 분석

### 통합 워크플로우 API
- `POST /api/workflow/process-excel` - 전체 프로세스 실행
- `POST /api/workflow/demo` - 데모 워크플로우 실행

## 🧪 테스트 실행

### 전체 테스트
```bash
npm test
```

### 특정 엔진 테스트
```bash
npm run test:classification
npm run test:calculation
```

### 테스트 커버리지
```bash
npm run test:coverage
```

## 📋 데모 워크플로우 실행

### 1. 서버 실행 후 데모 실행

```bash
curl -X POST http://localhost:3001/api/workflow/demo \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 2. 실제 Excel 파일 처리

```bash
curl -X POST http://localhost:3001/api/workflow/process-excel \
  -H "Content-Type: application/json" \
  -d '{
    "rawDataFilePath": "/path/to/raw-data.xlsx",
    "automationExcelPath": "/path/to/automation.xlsx"
  }'
```

## 🔧 주요 엔진 사용 예제

### 계정과목 자동 분류

```javascript
const ClassificationEngine = require('./src/engines/ClassificationEngine');

const engine = new ClassificationEngine();

const transactions = [
  {
    날짜: '2023-12-01',
    항목: '외래진료비',
    금액: 50000,
    보험유형: '건강보험',
    진료과: '내과'
  }
];

const result = await engine.classifyTransactions(transactions);
console.log(result.classified[0].account); // '건보수익'
```

### SUMIFS 계산 엔진

```javascript
const CalculationEngine = require('./src/engines/CalculationEngine');

const engine = new CalculationEngine();

const formulas = [
  {
    id: 'monthly_sum',
    type: 'SUMIFS',
    formula: 'SUMIFS(매출내역total!$G:$G,매출내역total!$A:$A,C$2,매출내역total!$J:$J,$B3)'
  }
];

const result = await engine.executeCalculations(classifiedData, formulas);
console.log(result.calculationResults['monthly_sum']);
```

### Excel 수식 파서

```javascript
const FormulaParser = require('./src/utils/FormulaParser');

const parser = new FormulaParser();
const context = parser.createExecutionContext(sheetData);

const formulaFunction = parser.parseFormula('=SUMIFS(A:A,B:B,"condition")', context);
const result = formulaFunction(context);
```

## 🏥 병원 데이터 처리 예제

### 실제 병원 거래내역 형식

```json
{
  "날짜": "2023-12-01",
  "환자번호": "P202312001",
  "항목": "외래진료비",
  "금액": 45000,
  "보험유형": "건강보험",
  "진료과": "내과",
  "의사": "김의사",
  "비고": "감기 치료"
}
```

### 자동 분류 결과

```json
{
  "account": "건보수익",
  "confidence": 0.95,
  "transactionType": "revenue",
  "appliedRules": ["건보수익분류", "내과수익분류"],
  "metadata": {
    "patientType": "건강보험",
    "department": "내과",
    "amount": 45000,
    "date": "2023-12-01"
  }
}
```

## 📈 성능 특징

### 분류 성능
- **처리 속도**: 1,000건 데이터 약 5분 내 완료
- **정확도**: Excel 원본 결과와 95% 이상 일치
- **신뢰도**: 계정별 분류 신뢰도 80% 이상

### 계산 성능
- **수식 실행**: 456개 SUMIFS 패턴 지원
- **정확도**: Excel 결과와 99% 일치 (1% 오차 허용)
- **처리 시간**: 3,950개 수식 약 60초 내 실행

### 전체 프로세스 성능
- **목표**: 4-6시간 수작업을 12분 자동화로 단축
- **시간 절약**: 95% 이상
- **오류 감소**: 수작업 대비 90% 이상 오류율 감소

## 🔒 품질 보증

### 8단계 품질 검증
1. **문법 검증**: 언어 파서, Context7 검증
2. **타입 검증**: Sequential 분석, 타입 호환성
3. **린트 검증**: Context7 규칙, 품질 분석
4. **보안 검증**: Sequential 분석, 취약성 평가
5. **테스트 검증**: Playwright E2E, 커버리지 분석 (≥80% unit, ≥70% integration)
6. **성능 검증**: Sequential 분석, 벤치마킹
7. **문서 검증**: Context7 패턴, 완성도 검증
8. **통합 검증**: Playwright 테스팅, 배포 검증

### 테스트 커버리지 목표
- **Unit Tests**: 80% 이상
- **Integration Tests**: 70% 이상
- **E2E Tests**: 주요 워크플로우 100%

## 🐛 디버깅 및 로깅

### 로그 레벨
- **ERROR**: 시스템 오류
- **WARN**: 경고 사항
- **INFO**: 일반 정보
- **DEBUG**: 상세 디버그 정보

### 주요 로그 포인트
- 분류 엔진: 분류 진행률, 신뢰도, 실패 케이스
- 계산 엔진: 수식 실행 상태, 오류, 성능
- 데이터 플로우: 단계별 진행률, 의존성, 오류

### 디버깅 방법

```bash
# 디버그 모드로 실행
DEBUG=medifinance:* npm run dev

# 특정 모듈만 디버그
DEBUG=medifinance:classification npm run dev
```

## 🔧 설정 및 환경 변수

### 필수 환경 변수

```env
NODE_ENV=development
PORT=3001
```

### 선택적 환경 변수

```env
# 데이터베이스 (향후 구현)
DB_PATH=./data/medifinance.db

# 로깅
LOG_LEVEL=info
LOG_FILE=./logs/medifinance.log

# Excel 처리
MAX_FILE_SIZE=50mb
TEMP_DIR=./temp

# 성능 튜닝
WORKER_THREADS=4
BATCH_SIZE=1000
```

## 📦 배포

### 프로덕션 빌드

```bash
npm run build
npm start
```

### Docker 배포

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  medifinance-backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
```

## 🤝 기여 방법

### 코드 스타일
- ESLint + Prettier 설정 준수
- JSDoc 주석 필수
- 테스트 코드 포함

### 커밋 메시지
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 스타일 변경
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 빌드 설정 등 기타 변경
```

## 📞 지원 및 문의

- **이슈 리포팅**: GitHub Issues
- **기능 요청**: GitHub Discussions
- **보안 취약점**: security@medifinance-pro.com

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

**MediFinance Pro v2** - 병원 재무 데이터 자동화를 통한 디지털 혁신
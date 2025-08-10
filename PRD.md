
# MediFinance Pro v2 - 병원 재무 데이터 자동화 시스템 PRD

## 📋 프로젝트 개요

**프로젝트명**: MediFinance Pro v2 - 병원 재무 데이터 자동화 시스템
**버전**: v2.0 (v1.0 MVP 기반 핵심 기능 재구현)
**목적**: 기존 병원 Excel 기반 재무 처리 프로세스를 완전 자동화하는 웹 시스템 구현
**우선순위**: 🔥 최고 우선순위 (실제 요구사항 구현)

## 🎯 핵심 문제 정의

### 현재 상황 분석
- ❌ **v1.0 MVP**: 일반적인 파일 업로드 대시보드 (실제 요구사항과 완전히 다름)
- ✅ **실제 요구사항**: 병원 재무담당자의 Excel 수작업 프로세스 완전 자동화

### 기존 수작업 프로세스 (현재)
```
1. 병원 시스템에서 매출/매입/인건비 등 로우데이터 다운로드 (Excel)
2. 자동화 Excel 파일에 로우데이터를 수작업으로 계정별 분류하여 입력
3. 3,950개 수식과 로직이 자동 실행되어 각 시트별 결과 생성
4. 손익계산서, 재무제표 등 최종 리포트 완성
```

### 목표 자동화 프로세스 (구현할 시스템)
```
1. 병원 로우데이터 Excel 파일 웹 업로드
2. AI 기반 자동 계정과목 분류 (수작업 대체)
3. 기존 Excel 수식 로직을 웹에서 완전 재현 실행
4. 웹 대시보드에서 실시간 결과 확인 및 리포트 생성
```

## 📊 Excel 파일 구조 분석

### 1. 로우데이터 Excel (입력 파일)
- **출처**: 병원 관리 시스템에서 직접 다운로드
- **내용**: 매출, 매입, 인건비 등 원시 거래 데이터
- **구조**:
  ```
  날짜 | 거래처 | 항목 | 금액 | 부서 | 환자유형 | 진료과 | ...
  ```
- **특징**: 계정과목 분류가 되지 않은 순수 거래 내역

### 2. 자동화 Excel (처리 파일)
- **역할**: 로우데이터를 받아 계정별 분류 후 재무제표 생성
- **핵심 구성요소**:
  - **입력 시트**: 로우데이터를 계정별로 수작업 분류 입력
  - **수식 시트들**: 3,950개 수식으로 계산 및 집계 처리
  - **출력 시트들**: 손익계산서, 재무상태표, 각종 분석 리포트
- **핵심 로직**:
  - 환자 유형별 수익 분류 (건보, 의보, 일반, 산재, 자보 등)
  - 진료과별 수익/비용 집계
  - 복잡한 회계 규칙 적용 (VLOOKUP, IF, SUMIF 등)
  - 시트간 데이터 연동 및 최종 재무제표 생성

## 🔍 핵심 자동화 목표

### 자동화해야 할 수작업 단계
1. **📄 로우데이터 분석**: 각 거래 내역이 어떤 계정과목에 속하는지 판단
2. **📊 계정별 분류**: 수작업으로 계정과목별 시트에 데이터 입력
3. **🔢 수식 실행**: 3,950개 Excel 수식이 자동 계산되어 재무제표 생성

### 시스템이 대체할 프로세스
```
기존: 로우데이터 Excel → (수작업 분류) → 자동화 Excel → 재무제표
목표: 로우데이터 Excel → (AI 자동 분류) → 웹 시스템 → 재무제표
```

## 🔍 Excel 분석 및 시스템 설계 요구사항

### Phase 1: 자동화 Excel 분석 (2일) 🔥 최우선
**목표**: 3,950개 수식의 완전한 이해와 재현

#### 1.1 자동화 Excel 구조 분석
- **입력 시트 분석**:
  - 계정과목별 입력 필드 구조
  - 필수 입력 항목과 선택 입력 항목
  - 데이터 검증 규칙 (Data Validation)
- **수식 시트 분석**:
  - 3,950개 수식의 카테고리별 분류
  - 시트간 참조 관계 매핑
  - 복잡한 중첩 수식 분해
- **출력 시트 분석**:
  - 손익계산서 구조 및 항목
  - 재무상태표 구조 및 항목
  - 기타 분석 리포트 구조

#### 1.2 수작업 분류 로직 추출 🔥 핵심
**목표**: 재무담당자가 어떤 기준으로 계정을 분류하는지 완전 파악

- **환자 유형 분류 규칙**:
  ```
  건강보험 → 건보수익 계정
  의료보험 → 의보수익 계정
  일반환자 → 일반수익 계정
  산재환자 → 산재수익 계정
  자동차보험 → 자보수익 계정
  ```

- **진료과별 분류 규칙**:
  ```
  내과 → 내과수익 계정
  외과 → 외과수익 계정
  소아과 → 소아과수익 계정
  ...
  ```

- **비용 항목 분류 규칙**:
  ```
  약품비 → 의약품비 계정
  재료비 → 의료재료비 계정
  인건비 → 급여 계정
  임대료 → 임차료 계정
  ...
  ```

#### 1.3 Excel 수식 로직 분석
- **조건부 계산식**: IF, IFS, SWITCH 함수 분석
- **조회 및 매칭**: VLOOKUP, INDEX/MATCH 분석
- **집계 함수**: SUMIF, SUMIFS, COUNTIF 분석
- **날짜/시간 함수**: 월별, 분기별 집계 로직
- **텍스트 처리**: 데이터 정제 및 분류 로직

### Phase 2: AI 분류 엔진 설계 (1일)

#### 2.1 자동 분류 알고리즘 설계
```typescript
interface AutoClassificationEngine {
  // 로우데이터 → 계정과목 자동 매핑
  classifyTransaction(rawData: TransactionRow): AccountMapping;
  
  // 분류 규칙 학습 및 적용
  applyClassificationRules(data: any[]): ClassifiedData[];
  
  // 불확실한 케이스 식별
  identifyUncertainCases(data: any[]): UncertainCase[];
}
```

#### 2.2 규칙 기반 분류 엔진
```javascript
// 실제 Excel 로직 기반 분류 규칙
const classificationRules = {
  // 환자 유형 기반 수익 분류
  revenueClassification: {
    건보수익: (row) => row.보험유형 === '건강보험' && row.금액 > 0,
    의보수익: (row) => row.보험유형 === '의료보험' && row.금액 > 0,
    일반수익: (row) => !row.보험유형 && row.금액 > 0,
    // ... 실제 Excel 조건문 재현
  },
  
  // 비용 항목 분류
  expenseClassification: {
    의약품비: (row) => row.항목.includes('약품') && row.금액 < 0,
    의료재료비: (row) => row.항목.includes('재료') && row.금액 < 0,
    급여: (row) => row.항목.includes('인건비') && row.금액 < 0,
    // ... 실제 Excel 조건문 재현
  }
};
```

## 🏗️ 시스템 아키텍처 (v1 기반 확장)

### 기존 v1 인프라 활용
```
✅ 파일 업로드 시스템 (그대로 사용)
✅ 데이터베이스 스키마 (확장)
✅ React 대시보드 구조 (대폭 수정)
✅ Express API 서버 (확장)
```

### 새로 추가할 핵심 컴포넌트
```
📁 backend/src/
├── services/
│   ├── excelAnalysisService.ts     # 자동화 Excel 분석 (3,950개 수식)
│   ├── autoClassificationEngine.ts # AI 기반 자동 계정 분류 엔진 🔥
│   ├── excelFormulaEngine.ts       # Excel 수식 실행 엔진 🔥
│   ├── financialReportService.ts   # 재무제표 생성 서비스
│   └── validationService.ts        # Excel vs 시스템 결과 검증
├── rules/
│   ├── patientTypeRules.ts         # 환자 유형 분류 규칙 (건보,의보,일반 등)
│   ├── departmentRules.ts          # 진료과별 분류 규칙
│   ├── revenueRules.ts             # 수익 계정 분류 규칙
│   ├── expenseRules.ts             # 비용 계정 분류 규칙
│   └── specialCaseRules.ts         # 특수 케이스 처리 규칙
├── engines/
│   ├── formulaParser.ts            # Excel 수식 파싱 및 변환
│   ├── calculationEngine.ts       # 수식 계산 실행
│   └── sheetConnector.ts           # 시트간 연동 로직
```

### 핵심 데이터 플로우
```
1. 로우데이터 Excel 업로드
   ↓
2. AI 자동 계정 분류 (수작업 대체)
   ↓
3. 분류된 데이터를 자동화 Excel 수식 엔진에 입력
   ↓
4. 3,950개 수식 실행 (웹에서 Excel 로직 재현)
   ↓
5. 손익계산서, 재무제표 등 최종 결과 생성
   ↓
6. 웹 대시보드에서 실시간 확인 및 리포트 다운로드
```

## 💡 수작업 vs 자동화 프로세스 비교

### 기존 수작업 프로세스 (현재)
| 단계 | 작업 내용 | 소요 시간 | 문제점 |
|------|-----------|-----------|--------|
| 1️⃣ | 병원 시스템에서 로우데이터 다운로드 | 10분 | 수동 작업 |
| 2️⃣ | **로우데이터 분석 및 계정 판단** | **2-3시간** | **수작업, 실수 위험** |
| 3️⃣ | **자동화 Excel에 계정별 수작업 입력** | **1-2시간** | **반복 작업, 실수 위험** |
| 4️⃣ | Excel 수식 자동 실행 | 5분 | 자동화됨 |
| 5️⃣ | 결과 검토 및 수정 | 30분 | 수동 검토 |
| **총 소요시간** | | **4-6시간** | **높은 인적 오류 가능성** |

### 목표 자동화 프로세스 (구현할 시스템)
| 단계 | 작업 내용 | 소요 시간 | 개선점 |
|------|-----------|-----------|--------|
| 1️⃣ | 웹에서 로우데이터 Excel 업로드 | 2분 | 간편한 웹 업로드 |
| 2️⃣ | **AI 자동 계정 분류** | **5분** | **완전 자동화** |
| 3️⃣ | **웹 시스템에서 수식 자동 실행** | **3분** | **완전 자동화** |
| 4️⃣ | 결과 자동 검증 및 리포트 생성 | 2분 | AI 기반 검증 |
| 5️⃣ | 웹 대시보드에서 실시간 확인 | 즉시 | 실시간 시각화 |
| **총 소요시간** | | **12분** | **95% 시간 절약, 오류 최소화** |

### 🎯 핵심 자동화 포인트
1. **수작업 계정 분류 → AI 자동 분류**: 2-3시간 → 5분
2. **Excel 수작업 입력 → 웹 자동 처리**: 1-2시간 → 3분
3. **수동 검토 → AI 검증**: 30분 → 2분

## 🎯 핵심 기능 명세

### 1. 자동화 Excel 분석 엔진 🔥
```typescript
interface ExcelAnalysisService {
  // 3,950개 수식 전체 분석
  analyzeAllFormulas(excelFile: File): Promise<FormulaAnalysisResult>;
  
  // 시트별 구조 분석
  analyzeSheetStructure(worksheet: any): SheetStructure;
  
  // 수식간 의존성 분석
  analyzeDependencies(formulas: Formula[]): DependencyGraph;
  
  // 입력 필드 요구사항 추출
  extractInputRequirements(sheet: any): InputField[];
}
```

### 2. AI 기반 자동 계정 분류 엔진 🔥
```typescript
interface AutoClassificationEngine {
  // 핵심: 로우데이터 → 계정과목 자동 분류 (수작업 대체)
  classifyTransactions(rawData: RawDataRow[]): Promise<ClassifiedTransaction[]>;
  
  // 분류 신뢰도 계산
  calculateConfidence(transaction: any, classification: string): number;
  
  // 불확실한 케이스 식별 (사용자 검토 필요)
  identifyUncertainCases(classified: ClassifiedTransaction[]): UncertainCase[];
  
  // 분류 규칙 학습 및 개선
  improveClassificationRules(feedback: UserFeedback[]): void;
}
```

### 3. Excel 수식 실행 엔진 🔥
```typescript
interface ExcelFormulaEngine {
  // 웹에서 Excel 수식 완전 재현
  executeFormulas(classifiedData: ClassifiedTransaction[], formulas: Formula[]): Promise<CalculationResult>;
  
  // 시트간 연동 처리
  processSheetConnections(sheets: SheetData[]): ConnectedSheetResult;
  
  // 실시간 계산 진행률 표시
  trackCalculationProgress(): ProgressEvent;
  
  // Excel 결과와 동일성 검증
  validateResults(systemResult: any, excelResult: any): ValidationReport;
}
```

### 4. 재무제표 생성 서비스
```typescript
interface FinancialReportService {
  // 손익계산서 생성
  generateIncomeStatement(calculatedData: any): IncomeStatement;
  
  // 재무상태표 생성
  generateBalanceSheet(calculatedData: any): BalanceSheet;
  
  // 각종 분석 리포트 생성
  generateAnalysisReports(calculatedData: any): AnalysisReport[];
  
  // Excel 형식 내보내기
  exportToExcel(reports: any[]): ExcelFile;
}
```

## 📊 데이터베이스 스키마 확장

### 기존 테이블 유지 + 새 테이블 추가
```sql
-- 기존 테이블들 유지 (users, hospitals, raw_data_files 등)

-- 새로 추가할 테이블들
CREATE TABLE classification_rules (
  id INTEGER PRIMARY KEY,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- 'patient_type', 'revenue', 'expense'
  excel_formula TEXT NOT NULL, -- 원본 Excel 수식
  javascript_logic TEXT NOT NULL, -- 변환된 JS 로직
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE account_mappings (
  id INTEGER PRIMARY KEY,
  raw_data_file_id INTEGER REFERENCES raw_data_files(id),
  original_row_data TEXT NOT NULL, -- JSON
  classified_account TEXT NOT NULL, -- 계정과목
  classification_confidence REAL DEFAULT 1.0,
  applied_rules TEXT NOT NULL, -- 적용된 규칙들 JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE classification_results (
  id INTEGER PRIMARY KEY,
  raw_data_file_id INTEGER REFERENCES raw_data_files(id),
  total_rows INTEGER NOT NULL,
  successfully_classified INTEGER NOT NULL,
  failed_classifications INTEGER NOT NULL,
  accuracy_score REAL DEFAULT 0.0,
  processing_time_ms INTEGER NOT NULL,
  result_summary TEXT NOT NULL, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔄 사용자 워크플로우 (완전 자동화)

### 1. 로우데이터 업로드 및 AI 자동 분류
```
1. 웹에서 병원 로우데이터 Excel 파일 업로드
2. AI 엔진이 각 거래내역을 계정과목별로 자동 분류
   - 환자유형 분석 (건보/의보/일반/산재/자보)
   - 진료과별 분류 (내과/외과/소아과 등)
   - 비용항목 분류 (약품비/재료비/인건비 등)
3. 실시간 분류 진행률 표시: "1,234건 중 567건 분류 완료..."
4. 불확실한 케이스는 사용자 검토 요청
```

### 2. Excel 수식 자동 실행 및 재무제표 생성
```
1. 분류된 데이터를 자동화 Excel 수식 엔진에 입력
2. 3,950개 수식을 웹에서 순차적으로 실행
   - VLOOKUP, IF, SUMIF 등 복잡한 수식 처리
   - 시트간 참조 및 연동 처리
3. 실시간 계산 진행률 표시: "수식 실행 중... 2,341/3,950"
4. 손익계산서, 재무상태표 자동 생성
```

### 3. 결과 확인 및 검증
```
1. 웹 대시보드에서 실시간 결과 확인
   - 계정과목별 집계 결과
   - 월별/분기별 분석 차트
   - 전년 동기 대비 분석
2. Excel 원본 결과와 자동 비교 검증
3. 차이점 발견 시 원인 분석 및 개선 제안
4. 분류 정확도 및 신뢰도 표시
```

### 4. 리포트 생성 및 활용
```
1. 기존 Excel과 동일한 형식의 재무제표 생성
2. 추가 인사이트 및 분석 리포트 제공
3. Excel/PDF 형식으로 다운로드
4. 향후 분류 정확도 개선을 위한 피드백 수집
```

## 🎨 UI/UX 요구사항

### 1. 분류 진행 화면
- **실시간 진행률**: "3,950개 규칙 중 1,234개 적용 완료..."
- **분류 상태**: 성공/실패/검토필요 케이스별 카운트
- **예상 완료 시간**: 남은 처리 시간 표시

### 2. 분류 결과 대시보드
```
📊 계정과목별 집계
├── 외래 수익: ₩12,345,678 (1,234건)
├── 입원 수익: ₩23,456,789 (567건)
├── 기타 수익: ₩1,234,567 (89건)
└── 총 수익: ₩37,037,034 (1,890건)

📈 분류 정확도
├── 자동 분류 성공: 95.2% (1,800건)
├── 검토 필요: 3.8% (72건)
└── 분류 실패: 1.0% (18건)
```

### 3. Excel 비교 화면
- **Side-by-side 비교**: 시스템 결과 vs Excel 원본 결과
- **차이점 하이라이트**: 불일치 항목 강조 표시
- **수정 제안**: AI 기반 분류 개선 제안

## 📈 성공 지표 (KPI)

### 1. 분류 정확도
- **목표**: Excel 원본 결과와 95% 이상 일치
- **측정**: 계정과목 분류 정확도, 금액 계산 정확도

### 2. 처리 성능
- **목표**: 1,000건 데이터 5분 이내 분류 완료
- **측정**: 평균 처리 시간, 대용량 파일 처리 속도

### 3. 사용자 만족도
- **목표**: Excel 수작업 대비 80% 이상 시간 절약
- **측정**: 작업 시간 단축, 오류 감소율

## 🚀 개발 단계별 계획 (총 6-7일)

### Phase 1: 자동화 Excel 완전 분석 (2일) 🔥 최우선
**목표**: 기존 Excel의 모든 로직을 100% 이해하고 재현 가능한 수준으로 분석

**Day 1**: 구조 분석
- [ ] 자동화 Excel 파일의 전체 시트 구조 분석
- [ ] 3,950개 수식을 카테고리별로 분류 (조건문/집계/조회/계산 등)
- [ ] 입력 시트의 계정과목 구조 및 필드 분석
- [ ] 시트간 참조 관계 및 데이터 플로우 매핑

**Day 2**: 분류 로직 추출
- [ ] 수작업 분류 규칙 완전 추출 (환자유형/진료과/비용항목별)
- [ ] 복잡한 조건부 수식 분해 및 JavaScript 함수로 변환
- [ ] 특수 케이스 및 예외 처리 로직 분석
- [ ] Excel 수식 → 웹 시스템 변환 가능성 검증

### Phase 2: AI 자동 분류 엔진 구현 (2일) 🔥 핵심
**목표**: 수작업 계정 분류를 완전 자동화

**Day 3**: 분류 엔진 구현
- [ ] 로우데이터 파싱 및 전처리 로직 구현
- [ ] 환자유형별 자동 분류 알고리즘 구현
- [ ] 진료과별/비용항목별 분류 규칙 엔진 구현
- [ ] 분류 신뢰도 계산 및 불확실 케이스 식별

**Day 4**: 검증 및 최적화
- [ ] 실제 로우데이터로 분류 테스트
- [ ] 분류 정확도 측정 및 개선
- [ ] 성능 최적화 (대용량 데이터 처리)
- [ ] 분류 결과 검증 시스템 구현

### Phase 3: Excel 수식 실행 엔진 구현 (1-2일)
**목표**: 웹에서 3,950개 Excel 수식 완전 재현

**Day 5**: 수식 엔진 구현
- [ ] Excel 수식 파싱 및 JavaScript 변환 엔진 구현
- [ ] VLOOKUP, IF, SUMIF 등 복잡한 함수 처리
- [ ] 시트간 참조 및 연동 로직 구현
- [ ] 실시간 계산 진행률 표시

**Day 6 (선택)**: 고급 수식 처리
- [ ] 중첩 수식 및 배열 함수 처리
- [ ] 날짜/시간 함수 및 텍스트 함수 구현
- [ ] Excel과 결과 동일성 검증 시스템
- [ ] 오류 처리 및 예외 상황 대응

### Phase 4: 웹 대시보드 및 리포트 (1일)
**목표**: 사용자 친화적인 결과 확인 및 리포트 생성

**Day 7**: UI/UX 구현
- [ ] 실시간 분류/계산 진행률 표시 UI
- [ ] 계정과목별 집계 결과 대시보드
- [ ] 재무제표 (손익계산서/재무상태표) 웹 표시
- [ ] Excel/PDF 형식 리포트 다운로드 기능
- [ ] Excel 원본과 비교 검증 화면

### 📋 각 Phase별 성공 기준
- **Phase 1**: Excel 수식 100% 이해, 분류 규칙 명확화
- **Phase 2**: 로우데이터 자동 분류 99% 정확도 달성
- **Phase 3**: Excel 수식 결과와 웹 시스템 결과 99% 일치
- **Phase 4**: 전체 프로세스 12분 이내 완료, 사용자 만족도 확인

## 🔧 기술적 고려사항

### 1. Excel 수식 파싱
- **라이브러리**: Formula.js, ExcelJS 활용
- **복잡한 수식**: VLOOKUP, IF, SUMIF 등 중첩 수식 처리
- **한국어 함수명**: Excel 한국어 함수명 대응

### 2. 성능 최적화
- **병렬 처리**: 대용량 데이터 청크 단위 분산 처리
- **캐싱**: 분류 규칙 및 중간 결과 캐싱
- **스트리밍**: 실시간 진행률 업데이트

### 3. 확장성
- **규칙 추가**: 새로운 분류 규칙 동적 추가
- **병원별 커스터마이징**: 병원별 특수 규칙 적용
- **업데이트**: Excel 수식 변경 시 시스템 업데이트

## 📝 추가 고려사항

### 1. 기존 v1 코드 활용
- **인프라 재사용**: 인증, 파일 업로드, 기본 대시보드 구조
- **점진적 교체**: 기존 기능 유지하면서 새 기능 추가
- **호환성 유지**: 기존 사용자 데이터 마이그레이션

### 2. 유지보수성
- **규칙 관리**: 분류 규칙의 버전 관리
- **로깅**: 분류 과정 상세 로깅
- **모니터링**: 분류 정확도 지속적 모니터링

### 3. 사용자 교육
- **마이그레이션 가이드**: Excel → 시스템 전환 안내
- **사용법 교육**: 새로운 자동분류 기능 사용법
- **트러블슈팅**: 일반적인 문제 해결 가이드

## 🎯 프로젝트 성공을 위한 핵심 포인트

### 1. 절대 우선순위 🔥
1. **자동화 Excel 분석**: 3,950개 수식의 완전한 이해가 프로젝트 성공의 절대 조건
2. **수작업 분류 로직 추출**: 재무담당자의 분류 기준을 100% 파악
3. **AI 자동 분류**: 2-3시간 수작업을 5분으로 단축하는 핵심 기능

### 2. 기술적 도전과제
- **복잡한 Excel 수식 처리**: VLOOKUP, IF, SUMIF 등 중첩 수식의 웹 구현
- **시트간 연동**: 여러 시트에 걸친 참조 관계의 정확한 재현
- **대용량 데이터 처리**: 실시간 진행률 표시와 성능 최적화

### 3. 검증 기준
- **분류 정확도**: Excel 수작업 결과와 95% 이상 일치
- **처리 속도**: 전체 프로세스 12분 이내 완료
- **사용자 만족도**: 4-6시간 → 12분으로 95% 시간 절약

### 4. 리스크 관리
- **Excel 수식 분석 실패**: 프로젝트 전체 실패로 직결 → Phase 1에 충분한 시간 투자
- **분류 정확도 부족**: 사용자 신뢰도 저하 → 지속적인 학습 및 개선 시스템 필수
- **성능 문제**: 대용량 데이터 처리 시 병목 현상 → 병렬 처리 및 캐싱 전략 필요

---

## 📋 문서 정보

**문서 작성일**: 2025년 1월 8일  
**대상 시스템**: MediFinance Pro v2 - 병원 재무 데이터 자동화 시스템  
**우선순위**: 🔥 최고 우선순위 (실제 병원 요구사항 구현)  
**예상 개발 기간**: 6-7일 (자동화 Excel 분석에 따라 조정 가능)  
**핵심 목표**: 병원 재무담당자의 4-6시간 수작업을 12분 자동화 프로세스로 대체
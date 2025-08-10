/**
 * MediFinance Pro v2 - Main Application Entry Point
 * 병원 재무 데이터 자동화 시스템의 메인 엔트리 포인트
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');

// 핵심 엔진 및 서비스 임포트
const ClassificationEngine = require('./engines/ClassificationEngine');
const CalculationEngine = require('./engines/CalculationEngine');
const DataFlowManager = require('./engines/DataFlowManager');
const ExcelService = require('./services/ExcelService');
const ValidationService = require('./services/ValidationService');
const FormulaParser = require('./utils/FormulaParser');
const DataProcessor = require('./utils/DataProcessor');

class MediFinanceProApp {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3001;
    
    // 핵심 엔진 초기화
    this.classificationEngine = new ClassificationEngine();
    this.calculationEngine = new CalculationEngine();
    this.dataFlowManager = new DataFlowManager();
    this.excelService = new ExcelService();
    this.validationService = new ValidationService();
    this.formulaParser = new FormulaParser();
    this.dataProcessor = new DataProcessor();
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * 미들웨어 초기화
   */
  initializeMiddleware() {
    // 보안 헤더
    this.app.use(helmet());
    
    // CORS 설정
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://medifinance-pro.com'] 
        : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
      credentials: true
    }));
    
    // 압축
    this.app.use(compression());
    
    // 로깅
    this.app.use(morgan('combined'));
    
    // Body 파서
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    
    // 정적 파일 서빙
    this.app.use('/static', express.static(path.join(__dirname, '../public')));
  }

  /**
   * 라우트 초기화
   */
  initializeRoutes() {
    // 헬스체크
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        services: {
          classificationEngine: 'active',
          calculationEngine: 'active',
          dataFlowManager: 'active',
          excelService: 'active',
          validationService: 'active'
        }
      });
    });

    // API 정보
    this.app.get('/api/info', (req, res) => {
      res.json({
        name: 'MediFinance Pro v2 API',
        version: '2.0.0',
        description: '병원 재무 데이터 자동화 시스템',
        endpoints: {
          classification: '/api/classification',
          calculation: '/api/calculation',
          dataflow: '/api/dataflow',
          validation: '/api/validation',
          excel: '/api/excel'
        }
      });
    });

    // 계정 분류 API
    this.setupClassificationRoutes();
    
    // 계산 엔진 API
    this.setupCalculationRoutes();
    
    // 데이터 플로우 API
    this.setupDataFlowRoutes();
    
    // Excel 서비스 API
    this.setupExcelRoutes();
    
    // 검증 서비스 API
    this.setupValidationRoutes();

    // 통합 워크플로우 API
    this.setupIntegratedWorkflowRoutes();
  }

  /**
   * 계정 분류 라우트 설정
   */
  setupClassificationRoutes() {
    // 거래내역 자동 분류
    this.app.post('/api/classification/classify', async (req, res) => {
      try {
        const { transactions, options = {} } = req.body;
        
        if (!Array.isArray(transactions)) {
          return res.status(400).json({
            error: 'transactions 배열이 필요합니다'
          });
        }

        const result = await this.classificationEngine.classifyTransactions(transactions);
        
        res.json({
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Classification error:', error);
        res.status(500).json({
          error: '분류 처리 중 오류가 발생했습니다',
          details: error.message
        });
      }
    });

    // 단일 거래내역 분류
    this.app.post('/api/classification/classify-single', async (req, res) => {
      try {
        const { transaction } = req.body;
        
        const result = await this.classificationEngine.classifyTransaction(transaction, 0);
        
        res.json({
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Single classification error:', error);
        res.status(500).json({
          error: '단일 거래 분류 중 오류가 발생했습니다',
          details: error.message
        });
      }
    });

    // 분류 규칙 조회
    this.app.get('/api/classification/rules', (req, res) => {
      res.json({
        success: true,
        data: this.classificationEngine.classificationRules,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * 계산 엔진 라우트 설정
   */
  setupCalculationRoutes() {
    // 수식 실행
    this.app.post('/api/calculation/execute', async (req, res) => {
      try {
        const { classifiedData, formulas } = req.body;
        
        const result = await this.calculationEngine.executeCalculations(classifiedData, formulas);
        
        res.json({
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Calculation error:', error);
        res.status(500).json({
          error: '계산 실행 중 오류가 발생했습니다',
          details: error.message
        });
      }
    });

    // 단일 수식 실행
    this.app.post('/api/calculation/execute-formula', async (req, res) => {
      try {
        const { formula } = req.body;
        
        const result = await this.calculationEngine.executeFormula(formula);
        
        res.json({
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Formula execution error:', error);
        res.status(500).json({
          error: '수식 실행 중 오류가 발생했습니다',
          details: error.message
        });
      }
    });
  }

  /**
   * 데이터 플로우 라우트 설정
   */
  setupDataFlowRoutes() {
    // 전체 데이터 플로우 실행
    this.app.post('/api/dataflow/execute', async (req, res) => {
      try {
        const { rawData, options = {} } = req.body;
        
        const result = await this.dataFlowManager.executeDataFlow(
          rawData, 
          this.classificationEngine, 
          this.calculationEngine
        );
        
        res.json({
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Data flow error:', error);
        res.status(500).json({
          error: '데이터 플로우 실행 중 오류가 발생했습니다',
          details: error.message
        });
      }
    });

    // 실시간 진행률 구독 (WebSocket 대신 Server-Sent Events 사용)
    this.app.get('/api/dataflow/progress/:sessionId', (req, res) => {
      const { sessionId } = req.params;
      
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });

      const progressCallback = (progress) => {
        res.write(`data: ${JSON.stringify(progress)}\n\n`);
      };

      this.dataFlowManager.subscribeToProgress(sessionId, progressCallback);

      req.on('close', () => {
        this.dataFlowManager.unsubscribeFromProgress(sessionId);
      });
    });
  }

  /**
   * Excel 서비스 라우트 설정
   */
  setupExcelRoutes() {
    // Excel 파일 분석
    this.app.post('/api/excel/analyze', async (req, res) => {
      try {
        const { filePath } = req.body;
        
        if (!filePath) {
          return res.status(400).json({
            error: 'filePath가 필요합니다'
          });
        }

        const result = await this.excelService.analyzeExcelFile(filePath);
        
        res.json({
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Excel analysis error:', error);
        res.status(500).json({
          error: 'Excel 파일 분석 중 오류가 발생했습니다',
          details: error.message
        });
      }
    });

    // 로우 데이터 파싱
    this.app.post('/api/excel/parse-raw-data', async (req, res) => {
      try {
        const { filePath } = req.body;
        
        const transactions = await this.excelService.parseRawDataFile(filePath);
        
        res.json({
          success: true,
          data: {
            transactions,
            count: transactions.length
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Raw data parsing error:', error);
        res.status(500).json({
          error: '로우 데이터 파싱 중 오류가 발생했습니다',
          details: error.message
        });
      }
    });

    // Excel 리포트 생성
    this.app.post('/api/excel/create-report', async (req, res) => {
      try {
        const { data, outputPath } = req.body;
        
        const filePath = await this.excelService.createExcelFile(data, outputPath);
        
        res.json({
          success: true,
          data: {
            filePath,
            message: 'Excel 리포트가 성공적으로 생성되었습니다'
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Excel report creation error:', error);
        res.status(500).json({
          error: 'Excel 리포트 생성 중 오류가 발생했습니다',
          details: error.message
        });
      }
    });
  }

  /**
   * 검증 서비스 라우트 설정
   */
  setupValidationRoutes() {
    // 결과 검증
    this.app.post('/api/validation/validate', async (req, res) => {
      try {
        const { systemResults, excelResults } = req.body;
        
        const result = await this.validationService.validateResults(systemResults, excelResults);
        
        res.json({
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Validation error:', error);
        res.status(500).json({
          error: '검증 처리 중 오류가 발생했습니다',
          details: error.message
        });
      }
    });

    // 검증 이력 조회
    this.app.get('/api/validation/history', (req, res) => {
      try {
        const { limit = 10 } = req.query;
        
        const history = this.validationService.getValidationHistory(parseInt(limit));
        
        res.json({
          success: true,
          data: history,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Validation history error:', error);
        res.status(500).json({
          error: '검증 이력 조회 중 오류가 발생했습니다',
          details: error.message
        });
      }
    });

    // 정확도 트렌드 분석
    this.app.get('/api/validation/trend', (req, res) => {
      try {
        const trend = this.validationService.analyzeAccuracyTrend();
        
        res.json({
          success: true,
          data: trend,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Trend analysis error:', error);
        res.status(500).json({
          error: '트렌드 분석 중 오류가 발생했습니다',
          details: error.message
        });
      }
    });
  }

  /**
   * 통합 워크플로우 라우트 설정
   */
  setupIntegratedWorkflowRoutes() {
    // 전체 프로세스 실행 (Excel 파일 입력 → 최종 결과)
    this.app.post('/api/workflow/process-excel', async (req, res) => {
      try {
        const { rawDataFilePath, automationExcelPath, options = {} } = req.body;
        
        console.log('🚀 전체 워크플로우 시작');
        console.log('📁 로우데이터 파일:', rawDataFilePath);
        console.log('📊 자동화 Excel 파일:', automationExcelPath);

        // 1. 로우 데이터 파싱
        console.log('📄 1단계: 로우 데이터 파싱 중...');
        const rawTransactions = await this.excelService.parseRawDataFile(rawDataFilePath);
        console.log(`✅ ${rawTransactions.length}개 거래내역 파싱 완료`);

        // 2. 자동화 Excel 분석 (선택사항)
        let excelAnalysis = null;
        if (automationExcelPath) {
          console.log('🔍 2단계: 자동화 Excel 분석 중...');
          excelAnalysis = await this.excelService.analyzeExcelFile(automationExcelPath);
          console.log(`✅ ${excelAnalysis.totalFormulas}개 수식 분석 완료`);
        }

        // 3. 전체 데이터 플로우 실행
        console.log('⚡ 3단계: 데이터 플로우 실행 중...');
        const dataFlowResult = await this.dataFlowManager.executeDataFlow(
          rawTransactions,
          this.classificationEngine,
          this.calculationEngine
        );

        // 4. 결과 집계 및 반환
        // 디버깅: 데이터 구조 확인
        console.log('🔍 dataFlowResult 구조:', Object.keys(dataFlowResult));
        if (dataFlowResult.results) {
          console.log('🔍 results 구조:', Object.keys(dataFlowResult.results));
          if (dataFlowResult.results.account_classification) {
            console.log('🔍 account_classification 구조:', Object.keys(dataFlowResult.results.account_classification));
            console.log('🔍 분류된 거래내역 수:', dataFlowResult.results.account_classification?.classifiedTransactions?.length || 0);
          }
          if (dataFlowResult.results.formula_execution) {
            console.log('🔍 formula_execution 구조:', Object.keys(dataFlowResult.results.formula_execution));
          }
        }
        
        const finalResult = {
          summary: {
            inputTransactions: rawTransactions.length,
            classifiedTransactions: dataFlowResult.results?.account_classification?.classifiedTransactions?.length || 0,
            formulasExecuted: dataFlowResult.results?.formula_execution?.formulasExecuted || 0,
            processingTime: dataFlowResult.results?.processingTime || 0,
            successRate: dataFlowResult.success ? '100%' : '실패'
          },
          classification: dataFlowResult.results?.account_classification,
          calculations: dataFlowResult.results?.formula_execution,
          reports: dataFlowResult.results?.report_generation?.reports,
          excelAnalysis: excelAnalysis,
          statistics: dataFlowResult.statistics,
          errors: dataFlowResult.errors || []
        };

        console.log('🎉 전체 워크플로우 완료');
        
        res.json({
          success: dataFlowResult.success,
          data: finalResult,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('❌ 통합 워크플로우 오류:', error);
        res.status(500).json({
          error: '통합 워크플로우 실행 중 오류가 발생했습니다',
          details: error.message
        });
      }
    });

    // 데모 데이터로 테스트 실행
    this.app.post('/api/workflow/demo', async (req, res) => {
      try {
        console.log('🎯 데모 워크플로우 시작');

        // 데모 데이터 생성
        const demoTransactions = this.generateDemoData();
        
        // 데이터 플로우 실행
        const result = await this.dataFlowManager.executeDataFlow(
          demoTransactions,
          this.classificationEngine,
          this.calculationEngine
        );

        res.json({
          success: result.success,
          data: {
            message: '데모 워크플로우가 완료되었습니다',
            demoDataCount: demoTransactions.length,
            result: result
          },
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Demo workflow error:', error);
        res.status(500).json({
          error: '데모 워크플로우 실행 중 오류가 발생했습니다',
          details: error.message
        });
      }
    });
  }

  /**
   * 데모 데이터 생성
   * @returns {Array} 데모 거래내역 배열
   */
  generateDemoData() {
    return [
      {
        날짜: '2023-12-01',
        항목: '외래진료비',
        금액: 45000,
        보험유형: '건강보험',
        진료과: '내과',
        거래처: '환자A',
        비고: '감기 치료'
      },
      {
        날짜: '2023-12-01',
        항목: '입원진료비',
        금액: 280000,
        보험유형: '의료보험',
        진료과: '외과',
        거래처: '환자B',
        비고: '수술 후 입원'
      },
      {
        날짜: '2023-12-01',
        항목: '자비진료비',
        금액: 150000,
        보험유형: null,
        진료과: '성형외과',
        거래처: '환자C',
        비고: '미용 성형'
      },
      {
        날짜: '2023-12-01',
        항목: '의약품 구입',
        금액: -180000,
        거래처: '한국제약',
        비고: '항생제, 진통제'
      },
      {
        날짜: '2023-12-01',
        항목: '의료재료 구입',
        금액: -95000,
        거래처: '메디컬코리아',
        비고: '수술용 장갑, 거즈'
      },
      {
        날짜: '2023-12-01',
        항목: '간호사 급여',
        금액: -2500000,
        부서: '병동',
        비고: '12월 급여'
      },
      {
        날짜: '2023-12-01',
        항목: '의사 급여',
        금액: -4000000,
        부서: '진료과',
        비고: '12월 급여'
      },
      {
        날짜: '2023-12-01',
        항목: '건물 임대료',
        금액: -3000000,
        거래처: '부동산업체',
        비고: '1층 임대료'
      },
      {
        날짜: '2023-12-01',
        항목: '전기료',
        금액: -450000,
        거래처: '한국전력',
        비고: '11월 전기료'
      },
      {
        날짜: '2023-12-01',
        항목: '장비 유지보수',
        금액: -1200000,
        거래처: '의료기기업체',
        비고: 'MRI 정기 점검'
      }
    ];
  }

  /**
   * 에러 핸들링 초기화
   */
  initializeErrorHandling() {
    // 404 에러 핸들러
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: '요청하신 엔드포인트를 찾을 수 없습니다',
        availableEndpoints: [
          'GET /health',
          'GET /api/info',
          'POST /api/classification/classify',
          'POST /api/calculation/execute',
          'POST /api/dataflow/execute',
          'POST /api/workflow/process-excel',
          'POST /api/workflow/demo'
        ]
      });
    });

    // 전역 에러 핸들러
    this.app.use((err, req, res, next) => {
      console.error('Unhandled error:', err);
      
      res.status(err.status || 500).json({
        error: '서버 내부 오류가 발생했습니다',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * 서버 시작
   */
  start() {
    this.app.listen(this.port, () => {
      console.log('🏥 MediFinance Pro v2 Backend Server Started');
      console.log(`🚀 Server running on port ${this.port}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('🔧 Available Services:');
      console.log('   ✅ Classification Engine');
      console.log('   ✅ Calculation Engine');
      console.log('   ✅ Data Flow Manager');
      console.log('   ✅ Excel Service');
      console.log('   ✅ Validation Service');
      console.log(`📡 Health Check: http://localhost:${this.port}/health`);
      console.log(`🎯 Demo Workflow: http://localhost:${this.port}/api/workflow/demo`);
      console.log('==========================================');
    });
  }
}

// 애플리케이션 실행
const app = new MediFinanceProApp();
app.start();

module.exports = MediFinanceProApp;
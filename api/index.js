/**
 * Vercel Serverless Function Entry Point
 * MediFinance Pro v2 - Hospital Finance Automation System
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// 핵심 엔진들
const ClassificationEngine = require('../backend/src/engines/ClassificationEngine');
const CalculationEngine = require('../backend/src/engines/CalculationEngine');
const VercelFileHandler = require('../backend/src/utils/VercelFileHandler');

// Express 앱 생성
const app = express();

// 미들웨어 설정
app.use(helmet());
app.use(cors({
  origin: ['*'], // Vercel에서는 모든 origin 허용
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// 엔진 인스턴스 생성
const classificationEngine = new ClassificationEngine();
const calculationEngine = new CalculationEngine();
const fileHandler = new VercelFileHandler();

// 헬스체크 엔드포인트
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🏥 MediFinance Pro v2 - Vercel Deployment',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: 'vercel-serverless'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    services: {
      classificationEngine: 'active',
      calculationEngine: 'active',
      vercelFileHandler: 'active'
    },
    environment: {
      platform: 'vercel',
      node_version: process.version,
      memory_usage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
    }
  });
});

// Vercel 상태 체크
app.get('/api/vercel/status', (req, res) => {
  const memoryUsage = process.memoryUsage();
  
  res.json({
    success: true,
    data: {
      environment: 'vercel-serverless',
      timestamp: new Date().toISOString(),
      limits: {
        maxFileSize: '5MB',
        maxExecutionTime: '10초 (Hobby) / 60초 (Pro)',
        memoryLimit: '1024MB'
      },
      currentStatus: {
        memoryUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
        memoryTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
        uptime: Math.round(process.uptime()) + '초',
        platform: process.platform,
        nodeVersion: process.version
      },
      features: {
        base64FileUpload: true,
        batchProcessing: true,
        realTimeProgress: false,
        fileDownload: false
      }
    }
  });
});

// 데모 엔드포인트
app.post('/api/vercel/demo', async (req, res) => {
  try {
    console.log('🎯 Vercel 데모 시작');

    // 소량 데모 데이터 생성
    const demoData = [
      {
        진료일: '20231201',
        성명: '환자A',
        보험종류: '건강보험',
        총진료비: 45000,
        환자부담액: 13500,
        진료과: '내과'
      },
      {
        진료일: '20231201', 
        성명: '환자B',
        보험종류: '의료보험',
        총진료비: 280000,
        환자부담액: 28000,
        진료과: '외과'
      },
      {
        진료일: '20231201',
        성명: '환자C',
        보험종류: null,
        총진료비: 150000,
        환자부담액: 150000,
        진료과: '성형외과'
      }
    ];

    const result = await classificationEngine.classifyTransactions(demoData);

    res.json({
      success: true,
      data: {
        message: 'Vercel 데모 처리 완료',
        input: demoData,
        result: {
          classified: result.classifiedTransactions?.length || 0,
          failed: result.failedCases?.length || 0,
          accuracy: result.statistics?.accuracy || 0
        },
        environment: 'vercel-serverless',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Vercel 데모 오류:', error);
    res.status(500).json({
      error: '데모 처리 중 오류가 발생했습니다',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Base64 파일 처리
app.post('/api/vercel/process-file', async (req, res) => {
  try {
    const { fileData, filename, fileType = 'rawData' } = req.body;

    if (!fileData || !filename) {
      return res.status(400).json({
        error: 'fileData와 filename이 필요합니다',
        usage: {
          fileData: 'base64 encoded file content',
          filename: 'string',
          fileType: 'rawData | automation (optional)'
        }
      });
    }

    console.log(`🚀 Vercel 파일 처리 시작: ${filename} (${fileType})`);
    const startTime = Date.now();

    // Base64 파일 처리
    const parsedData = await fileHandler.processBase64File(fileData, filename);
    
    if (fileType === 'rawData') {
      // 로우데이터 → 거래내역 변환
      const transactions = fileHandler.convertToTransactions(parsedData);
      
      if (transactions.length === 0) {
        return res.status(400).json({
          error: '유효한 거래내역을 찾을 수 없습니다',
          suggestions: [
            'Excel 파일에 진료일, 금액, 환자 정보가 포함되어 있는지 확인해주세요',
            '시트가 비어있지 않은지 확인해주세요'
          ]
        });
      }

      // 응답 데이터 압축
      const compressedData = fileHandler.compressResponseData(transactions);
      
      res.json({
        success: true,
        data: {
          type: 'transactions',
          filename,
          totalCount: transactions.length,
          sampleData: compressedData.sampleData,
          hasMore: compressedData.hasMore,
          processingTime: Date.now() - startTime
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          type: 'analysis',
          filename,
          fileInfo: parsedData,
          processingTime: Date.now() - startTime
        }
      });
    }

  } catch (error) {
    console.error('Vercel 파일 처리 오류:', error);
    res.status(500).json({
      error: error.message || '파일 처리 중 오류가 발생했습니다',
      timestamp: new Date().toISOString()
    });
  }
});

// 경량 분류 처리
app.post('/api/vercel/classify-light', async (req, res) => {
  try {
    const { transactions, maxCount = 100 } = req.body;

    if (!Array.isArray(transactions)) {
      return res.status(400).json({
        error: 'transactions 배열이 필요합니다'
      });
    }

    // 처리량 제한 (Vercel 시간 제한 고려)
    const limitedTransactions = transactions.slice(0, maxCount);
    
    console.log(`⚡ 경량 분류 처리: ${limitedTransactions.length}건`);
    const startTime = Date.now();

    const result = await classificationEngine.classifyTransactions(limitedTransactions);
    
    // 응답 데이터 압축
    const compressedResult = {
      summary: {
        totalProcessed: limitedTransactions.length,
        successCount: result.classifiedTransactions?.length || 0,
        failedCount: result.failedCases?.length || 0,
        accuracy: result.statistics?.accuracy || 0
      },
      classifiedSample: result.classifiedTransactions?.slice(0, 20) || [],
      failedSample: result.failedCases?.slice(0, 10) || [],
      statistics: result.statistics,
      processingTime: Date.now() - startTime
    };

    res.json({
      success: true,
      data: compressedResult
    });

  } catch (error) {
    console.error('경량 분류 처리 오류:', error);
    res.status(500).json({
      error: error.message || '분류 처리 중 오류가 발생했습니다',
      timestamp: new Date().toISOString()
    });
  }
});

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({
    error: '요청하신 엔드포인트를 찾을 수 없습니다',
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /api/vercel/status',
      'POST /api/vercel/demo',
      'POST /api/vercel/process-file',
      'POST /api/vercel/classify-light'
    ],
    timestamp: new Date().toISOString()
  });
});

// 전역 에러 핸들러
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    error: '서버 내부 오류가 발생했습니다',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    timestamp: new Date().toISOString()
  });
});

// Vercel Serverless Function Export
module.exports = app;
/**
 * Vercel Serverless Function Entry Point
 * MediFinance Pro v2 - Hospital Finance Automation System
 */

const express = require('express');
const cors = require('cors');

// Express 앱 생성
const app = express();

// 미들웨어 설정 (최소한만)
app.use(cors());
app.use(express.json({ limit: '1mb' }));

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

// 데모 엔드포인트 (단순한 버전)
app.post('/api/vercel/demo', async (req, res) => {
  try {
    console.log('🎯 Vercel 데모 시작');

    // 간단한 데모 응답
    res.json({
      success: true,
      data: {
        message: 'MediFinance Pro v2 데모',
        status: '기본 서버리스 함수 작동 중',
        features: {
          fileProcessing: '개발 중',
          classification: '개발 중', 
          calculations: '개발 중'
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

// 파일 처리 (단순한 버전)
app.post('/api/vercel/process-file', async (req, res) => {
  try {
    res.json({
      success: false,
      message: '파일 처리 기능은 현재 개발 중입니다',
      info: 'Vercel 서버리스 환경에서는 복잡한 파일 처리가 제한적입니다.',
      alternatives: [
        '소량 데이터는 직접 JSON으로 전송',
        '대용량 파일은 별도 서버 사용 권장'
      ]
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
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
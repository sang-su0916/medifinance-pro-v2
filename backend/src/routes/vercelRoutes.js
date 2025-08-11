/**
 * Vercel 최적화된 API 라우트
 * 파일 업로드를 Base64로 처리하여 Vercel 제한사항 우회
 */

const express = require('express');
const router = express.Router();
const VercelFileHandler = require('../utils/VercelFileHandler');
const ClassificationEngine = require('../engines/ClassificationEngine');
const CalculationEngine = require('../engines/CalculationEngine');
const DataFlowManager = require('../engines/DataFlowManager');

// 엔진 인스턴스 생성
const fileHandler = new VercelFileHandler();
const classificationEngine = new ClassificationEngine();
const calculationEngine = new CalculationEngine();
const dataFlowManager = new DataFlowManager();

/**
 * Base64 파일 업로드 및 처리 (Vercel 최적화)
 * POST /api/vercel/process-file
 */
router.post('/process-file', async (req, res) => {
  try {
    const { fileData, filename, fileType = 'rawData' } = req.body;

    if (!fileData) {
      return res.status(400).json({
        error: 'fileData가 필요합니다 (Base64 인코딩)',
        usage: 'fileData: base64 encoded file content'
      });
    }

    if (!filename) {
      return res.status(400).json({
        error: 'filename이 필요합니다',
        usage: 'filename: string'
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
            '시트가 비어있지 않은지 확인해주세요',
            '헤더 행이 올바르게 설정되어 있는지 확인해주세요'
          ]
        });
      }

      // 응답 데이터 압축 (Vercel 응답 크기 제한 고려)
      const compressedData = fileHandler.compressResponseData(transactions);
      
      res.json({
        success: true,
        data: {
          type: 'transactions',
          filename,
          totalCount: transactions.length,
          sampleData: compressedData.sampleData,
          hasMore: compressedData.hasMore,
          fileInfo: parsedData,
          processingTime: Date.now() - startTime
        }
      });

    } else {
      // 자동화 Excel 파일 처리
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
    res.status(500).json(fileHandler.formatError(error));
  }
});

/**
 * 분할 처리 워크플로우 (Vercel 시간 제한 대응)
 * POST /api/vercel/process-workflow
 */
router.post('/process-workflow', async (req, res) => {
  try {
    const { transactions, batchSize = 500, startIndex = 0 } = req.body;

    if (!Array.isArray(transactions)) {
      return res.status(400).json({
        error: 'transactions 배열이 필요합니다'
      });
    }

    console.log(`🔄 분할 워크플로우 시작: ${startIndex}~${startIndex + batchSize}/${transactions.length}`);
    const startTime = Date.now();

    // 배치 단위로 처리
    const batch = transactions.slice(startIndex, startIndex + batchSize);
    
    if (batch.length === 0) {
      return res.json({
        success: true,
        data: {
          message: '처리할 데이터가 없습니다',
          completed: true
        }
      });
    }

    // 분류 처리
    const classificationResult = await classificationEngine.classifyTransactions(batch);
    
    const processingTime = Date.now() - startTime;
    const isCompleted = (startIndex + batchSize) >= transactions.length;

    res.json({
      success: true,
      data: {
        batchResult: {
          startIndex,
          endIndex: startIndex + batch.length,
          processed: batch.length,
          classification: classificationResult
        },
        progress: {
          completed: startIndex + batch.length,
          total: transactions.length,
          percentage: Math.round(((startIndex + batch.length) / transactions.length) * 100)
        },
        isCompleted,
        nextBatch: isCompleted ? null : {
          startIndex: startIndex + batchSize,
          url: '/api/vercel/process-workflow'
        },
        processingTime
      }
    });

  } catch (error) {
    console.error('Vercel 워크플로우 오류:', error);
    res.status(500).json(fileHandler.formatError(error));
  }
});

/**
 * 경량 분류 처리 (소량 데이터용)
 * POST /api/vercel/classify-light
 */
router.post('/classify-light', async (req, res) => {
  try {
    const { transactions, maxCount = 1000 } = req.body;

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
      classifiedSample: result.classifiedTransactions?.slice(0, 50) || [],
      failedSample: result.failedCases?.slice(0, 20) || [],
      statistics: result.statistics,
      processingTime: Date.now() - startTime
    };

    res.json({
      success: true,
      data: compressedResult
    });

  } catch (error) {
    console.error('경량 분류 처리 오류:', error);
    res.status(500).json(fileHandler.formatError(error));
  }
});

/**
 * 시스템 상태 체크 (Vercel 환경 확인)
 * GET /api/vercel/status
 */
router.get('/status', (req, res) => {
  const memoryUsage = process.memoryUsage();
  
  res.json({
    success: true,
    data: {
      environment: 'vercel',
      timestamp: new Date().toISOString(),
      limits: {
        maxFileSize: '5MB',
        maxExecutionTime: '10초 (Hobby) / 60초 (Pro)',
        memoryLimit: '1024MB'
      },
      currentStatus: {
        memoryUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
        memoryTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
        uptime: Math.round(process.uptime()) + '초'
      },
      features: {
        base64FileUpload: true,
        batchProcessing: true,
        realTimeProgress: false, // EventSource는 Vercel에서 제한적
        fileDownload: false // 파일 생성 제한
      }
    }
  });
});

/**
 * 데모 처리 (Vercel 테스트용)
 * POST /api/vercel/demo
 */
router.post('/demo', async (req, res) => {
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
        environment: 'vercel'
      }
    });

  } catch (error) {
    console.error('Vercel 데모 오류:', error);
    res.status(500).json(fileHandler.formatError(error));
  }
});

module.exports = router;
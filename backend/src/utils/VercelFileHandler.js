/**
 * Vercel 환경에 최적화된 파일 처리 유틸리티
 * 파일 업로드를 Base64 스트리밍으로 처리하여 메모리 효율성 확보
 */

const XLSX = require('xlsx');
const path = require('path');
const os = require('os');
const fs = require('fs');

class VercelFileHandler {
  constructor() {
    this.maxFileSize = 5 * 1024 * 1024; // 5MB로 제한 (Vercel 호환)
    this.tempDir = '/tmp'; // Vercel에서 사용 가능한 임시 디렉토리
  }

  /**
   * Base64 인코딩된 파일을 처리
   * @param {string} base64Data - Base64 인코딩된 파일 데이터
   * @param {string} filename - 파일명
   * @returns {Promise<Object>} 파싱된 Excel 데이터
   */
  async processBase64File(base64Data, filename) {
    try {
      // Base64 데이터 크기 체크
      const dataSize = (base64Data.length * 3) / 4; // Base64 디코딩 후 실제 크기
      
      if (dataSize > this.maxFileSize) {
        throw new Error(`파일 크기가 ${Math.round(this.maxFileSize / 1024 / 1024)}MB를 초과합니다. (${Math.round(dataSize / 1024 / 1024)}MB)`);
      }

      // Base64 데이터를 Buffer로 변환
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Excel 파일을 메모리에서 직접 처리
      const workbook = XLSX.read(buffer, { 
        type: 'buffer',
        cellDates: true,
        cellNF: false,
        cellText: false
      });

      return this.parseWorkbook(workbook, filename);
      
    } catch (error) {
      console.error('Base64 파일 처리 오류:', error);
      throw new Error(`파일 처리 실패: ${error.message}`);
    }
  }

  /**
   * 멀티파트 파일 업로드 처리 (Express multer 대안)
   * @param {Buffer} fileBuffer - 파일 버퍼
   * @param {string} filename - 파일명
   * @returns {Promise<Object>} 파싱된 데이터
   */
  async processFileBuffer(fileBuffer, filename) {
    try {
      if (fileBuffer.length > this.maxFileSize) {
        throw new Error(`파일 크기가 ${Math.round(this.maxFileSize / 1024 / 1024)}MB를 초과합니다.`);
      }

      const workbook = XLSX.read(fileBuffer, {
        type: 'buffer',
        cellDates: true,
        cellNF: false,
        cellText: false
      });

      return this.parseWorkbook(workbook, filename);

    } catch (error) {
      console.error('파일 버퍼 처리 오류:', error);
      throw new Error(`파일 처리 실패: ${error.message}`);
    }
  }

  /**
   * Workbook 파싱
   * @param {Object} workbook - XLSX workbook 객체
   * @param {string} filename - 파일명
   * @returns {Object} 파싱된 데이터
   */
  parseWorkbook(workbook, filename) {
    const result = {
      filename,
      sheets: {},
      sheetNames: workbook.SheetNames,
      totalRows: 0,
      processingTime: Date.now()
    };

    // 각 시트별 데이터 추출
    workbook.SheetNames.forEach(sheetName => {
      try {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: null,
          blankrows: false
        });

        // 빈 행 제거
        const filteredData = jsonData.filter(row => 
          row && row.some(cell => cell !== null && cell !== undefined && cell !== '')
        );

        if (filteredData.length > 0) {
          // 헤더 행 감지
          const headers = filteredData[0];
          const dataRows = filteredData.slice(1);

          result.sheets[sheetName] = {
            headers,
            data: dataRows,
            rowCount: dataRows.length
          };

          result.totalRows += dataRows.length;
        }

      } catch (sheetError) {
        console.warn(`시트 '${sheetName}' 처리 중 경고:`, sheetError.message);
        result.sheets[sheetName] = {
          error: sheetError.message,
          headers: [],
          data: [],
          rowCount: 0
        };
      }
    });

    result.processingTime = Date.now() - result.processingTime;
    
    console.log(`✅ 파일 처리 완료: ${filename}`);
    console.log(`📊 총 시트: ${workbook.SheetNames.length}, 총 행: ${result.totalRows}`);
    console.log(`⏱️ 처리 시간: ${result.processingTime}ms`);

    return result;
  }

  /**
   * 로우데이터 Excel을 거래내역 배열로 변환
   * @param {Object} parsedData - parseWorkbook 결과
   * @returns {Array} 거래내역 배열
   */
  convertToTransactions(parsedData) {
    const transactions = [];
    
    // 각 시트에서 거래내역 추출
    Object.entries(parsedData.sheets).forEach(([sheetName, sheet]) => {
      if (sheet.error || !sheet.data || sheet.data.length === 0) {
        return;
      }

      const headers = sheet.headers;
      
      sheet.data.forEach((row, index) => {
        try {
          const transaction = {};
          
          // 헤더와 데이터 매핑
          headers.forEach((header, colIndex) => {
            if (header && row[colIndex] !== null && row[colIndex] !== undefined) {
              transaction[String(header)] = row[colIndex];
            }
          });

          // 필수 필드 체크 (병원 데이터 기준)
          if (this.isValidTransaction(transaction)) {
            transaction._source = {
              sheet: sheetName,
              row: index + 2 // Excel 행 번호 (헤더 제외)
            };
            transactions.push(transaction);
          }

        } catch (rowError) {
          console.warn(`행 처리 오류 (${sheetName}, 행 ${index + 2}):`, rowError.message);
        }
      });
    });

    console.log(`🔄 거래내역 변환 완료: ${transactions.length}건`);
    return transactions;
  }

  /**
   * 거래내역 유효성 검증
   * @param {Object} transaction - 거래내역 객체
   * @returns {boolean} 유효성 여부
   */
  isValidTransaction(transaction) {
    // 병원 데이터 필수 필드들 (유연하게 체크)
    const hasDate = transaction['진료일'] || transaction['월'] || transaction['일'];
    const hasAmount = transaction['총진료비'] || transaction['수납액'] || transaction['환자부담액'];
    const hasDescription = transaction['성명'] || transaction['고객번호'] || transaction['보험종류'];

    return hasDate || hasAmount || hasDescription;
  }

  /**
   * 처리된 데이터를 압축하여 응답 크기 최적화
   * @param {Object} data - 처리할 데이터
   * @returns {Object} 압축된 데이터
   */
  compressResponseData(data) {
    return {
      summary: {
        totalTransactions: data.length || 0,
        processedAt: new Date().toISOString(),
        fileInfo: data.fileInfo || {}
      },
      // 대용량 데이터는 샘플만 포함
      sampleData: Array.isArray(data) ? data.slice(0, 100) : data,
      hasMore: Array.isArray(data) && data.length > 100
    };
  }

  /**
   * 에러 응답 표준화
   * @param {Error} error - 발생한 에러
   * @returns {Object} 표준화된 에러 응답
   */
  formatError(error) {
    return {
      error: error.message || '파일 처리 중 오류가 발생했습니다',
      code: error.code || 'FILE_PROCESSING_ERROR',
      timestamp: new Date().toISOString(),
      suggestions: this.getErrorSuggestions(error)
    };
  }

  /**
   * 에러별 해결 제안사항
   * @param {Error} error - 발생한 에러
   * @returns {Array} 제안사항 배열
   */
  getErrorSuggestions(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('크기') || message.includes('size')) {
      return [
        '파일 크기를 5MB 이하로 줄여주세요',
        'Excel에서 불필요한 행/열을 삭제해보세요',
        'CSV 형식으로 변환해보세요'
      ];
    }
    
    if (message.includes('형식') || message.includes('format')) {
      return [
        '.xlsx 또는 .xls 형식인지 확인해주세요',
        '파일이 손상되지 않았는지 확인해주세요',
        'Excel에서 다시 저장해보세요'
      ];
    }
    
    return [
      '파일 형식과 크기를 확인해주세요',
      '문제가 지속되면 관리자에게 문의해주세요'
    ];
  }
}

module.exports = VercelFileHandler;
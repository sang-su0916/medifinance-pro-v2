#!/usr/bin/env node

/**
 * 데이터 로드 디버깅 스크립트
 * Excel 파일이 제대로 로드되는지 확인
 */

const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

async function debugDataLoad() {
  console.log('🔍 데이터 로드 디버깅 시작');
  console.log('=' .repeat(50));
  
  const testFiles = [
    '/Users/isangsu/TMP_MY/HOS-P/25년1월.xls',
    '/Users/isangsu/TMP_MY/HOS-P/decrypted_sample.xlsx',
    '/Users/isangsu/TMP_MY/HOS-P/analysis/formula_summary.json'
  ];
  
  testFiles.forEach((filePath, index) => {
    console.log(`\n📁 파일 ${index + 1}: ${path.basename(filePath)}`);
    
    if (!fs.existsSync(filePath)) {
      console.log('❌ 파일 없음');
      return;
    }
    
    const stats = fs.statSync(filePath);
    console.log(`✅ 파일 크기: ${(stats.size / 1024).toFixed(1)}KB`);
    
    if (filePath.endsWith('.json')) {
      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log(`📊 JSON 키: ${Object.keys(content).join(', ')}`);
        if (content.totals) {
          console.log(`📈 총 수식: ${content.totals.totalFormulas}개`);
        }
      } catch (error) {
        console.log(`❌ JSON 파싱 실패: ${error.message}`);
      }
    } else {
      // Excel 파일 분석
      try {
        const workbook = xlsx.readFile(filePath);
        console.log(`📋 시트: ${workbook.SheetNames.length}개 [${workbook.SheetNames.join(', ')}]`);
        
        // 각 시트 분석
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: null });
          
          console.log(`   📄 ${sheetName}: ${jsonData.length}행`);
          
          if (jsonData.length > 0) {
            const firstRow = jsonData[0];
            const validCells = firstRow ? firstRow.filter(cell => cell !== null && cell !== undefined && cell !== '').length : 0;
            console.log(`     🔤 첫 행: ${validCells}개 유효 셀 [${firstRow ? firstRow.slice(0, 5).map(c => c || 'null').join(', ') : 'empty'}...]`);
            
            // 데이터 샘플링
            if (jsonData.length > 1) {
              let dataRowsWithContent = 0;
              for (let i = 1; i < Math.min(10, jsonData.length); i++) {
                const row = jsonData[i];
                if (row && row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
                  dataRowsWithContent++;
                }
              }
              console.log(`     📊 유효 데이터 행: 최소 ${dataRowsWithContent}개 (처음 10행 중)`);
              
              // 헤더 추정
              const headerKeywords = ['날짜', '일자', '항목', '내용', '금액', '수입', '지출', '거래처', '계정'];
              let headerRowFound = false;
              
              for (let i = 0; i < Math.min(3, jsonData.length); i++) {
                const row = jsonData[i];
                if (row && Array.isArray(row)) {
                  const matchCount = row.filter(cell => {
                    const cellStr = String(cell || '').toLowerCase();
                    return headerKeywords.some(keyword => cellStr.includes(keyword));
                  }).length;
                  
                  if (matchCount >= 2) {
                    console.log(`     🎯 헤더 행 추정: ${i}행 (${matchCount}개 키워드 매칭)`);
                    console.log(`        헤더: [${row.filter(h => h).slice(0, 8).join(', ')}...]`);
                    headerRowFound = true;
                    break;
                  }
                }
              }
              
              if (!headerRowFound) {
                console.log(`     ⚠️ 헤더 행을 찾을 수 없음`);
              }
            }
          }
        });
        
      } catch (error) {
        console.log(`❌ Excel 파일 로드 실패: ${error.message}`);
      }
    }
  });
  
  // 실제 변환 테스트
  console.log('\n🔄 실제 데이터 변환 테스트');
  console.log('=' .repeat(50));
  
  const ValidationSystem = require('./ValidationSystem');
  const validationSystem = new ValidationSystem();
  
  try {
    const testData = await validationSystem.loadTestData();
    
    console.log('\n📊 로드 결과:');
    if (testData.rawSample) {
      console.log(`✅ 로우 샘플: ${testData.rawSample.sheets?.length || 0}개 시트`);
      if (testData.rawSample.data) {
        Object.keys(testData.rawSample.data).forEach(sheetName => {
          const sheetData = testData.rawSample.data[sheetName];
          console.log(`   - ${sheetName}: ${sheetData ? sheetData.length : 0}행`);
        });
      }
    } else {
      console.log('❌ 로우 샘플 로드 실패');
    }
    
    if (testData.excelReference) {
      console.log(`✅ Excel 참조: ${testData.excelReference.sheets?.length || 0}개 시트`);
    } else {
      console.log('❌ Excel 참조 로드 실패');
    }
    
    if (testData.formulaAnalysis) {
      console.log(`✅ 수식 분석: ${testData.formulaAnalysis.totals?.totalFormulas || 0}개 수식`);
    } else {
      console.log('❌ 수식 분석 로드 실패');
    }
    
    // 거래내역 변환 테스트
    console.log('\n🔄 거래내역 변환 테스트:');
    const transactions = validationSystem.convertRawDataToTransactions(testData.rawSample);
    console.log(`✅ 변환 결과: ${transactions.length}건`);
    
    if (transactions.length > 0) {
      console.log('\n📋 변환된 거래내역 샘플 (처음 3건):');
      transactions.slice(0, 3).forEach((transaction, index) => {
        console.log(`${index + 1}. 키: [${Object.keys(transaction).join(', ')}]`);
        console.log(`   값: {${Object.entries(transaction).slice(0, 4).map(([k, v]) => `${k}: ${v}`).join(', ')}}`);
      });
    }
    
  } catch (error) {
    console.error('❌ ValidationSystem 테스트 실패:', error.message);
    console.error(error.stack);
  }
  
  console.log('\n✨ 디버깅 완료');
}

// 스크립트 실행
debugDataLoad().catch(error => {
  console.error('💥 디버깅 실패:', error);
  process.exit(1);
});
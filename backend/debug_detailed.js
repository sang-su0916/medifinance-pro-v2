#!/usr/bin/env node

/**
 * 상세 디버깅 스크립트 - 셀 참조와 계정과목 매핑 문제 분석
 */

const CalculationEngine = require('./src/engines/CalculationEngine');
const XLSX = require('xlsx');
const path = require('path');

async function detailedDebug() {
  console.log('=== 상세 디버깅 시작 ===\n');

  const excelPath = path.join(__dirname, '..', 'decrypted_sample.xlsx');
  
  try {
    // Excel 데이터 로드
    const workbook = XLSX.readFile(excelPath, { cellFormula: true });
    const sheets = {};
    
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, 
        raw: false,
        defval: null 
      });
      sheets[sheetName] = data;
    });

    console.log('=== 시트 데이터 확인 ===');
    console.log(`사업장요약현황 시트 행수: ${sheets['사업장요약현황'].length}`);
    console.log(`사업장요약현황 시트 첫번째 행 길이: ${sheets['사업장요약현황'][0]?.length || 0}`);
    
    // 사업장요약현황 O열 상세 확인
    console.log('\n=== 사업장요약현황 O열 상세 분석 ===');
    const businessSheet = sheets['사업장요약현황'];
    for (let row = 1; row <= 15; row++) {
      const rowData = businessSheet[row - 1];
      if (rowData) {
        const oValue = rowData[14]; // O열은 15번째 (인덱스 14)
        console.log(`Row ${row}: O열(인덱스14) = ${JSON.stringify(oValue)} (타입: ${typeof oValue})`);
      } else {
        console.log(`Row ${row}: 행 데이터 없음`);
      }
    }

    console.log('\n=== 월별요약손익계산서(추정) 시트 분석 ===');
    const summarySheet = sheets['월별요약손익계산서(추정)'];
    console.log(`시트 행수: ${summarySheet.length}`);
    
    // C2 (3행 2열, 인덱스 1,2)
    console.log(`C2 (행1,열2): ${JSON.stringify(summarySheet[1]?.[2])}`);
    // B5 (6행 1열, 인덱스 4,1)  
    console.log(`B5 (행4,열1): ${JSON.stringify(summarySheet[4]?.[1])}`);

    // 계산 엔진 초기화 및 테스트
    console.log('\n=== 계산 엔진 테스트 ===');
    const engine = new CalculationEngine();
    
    // 시트 데이터 로드
    Object.keys(sheets).forEach(sheetName => {
      engine.sheetData.set(sheetName, sheets[sheetName]);
    });

    // 계정과목 매핑 생성
    await engine.createAccountMappings();

    // 개별 셀 참조 테스트
    console.log('\n=== 개별 셀 참조 테스트 ===');
    
    const c2Value = engine.resolveExcelCellReference('C2', '월별요약손익계산서(추정)');
    console.log(`C2 해결 결과: ${JSON.stringify(c2Value)}`);
    
    const b5Value = engine.resolveExcelCellReference('B5', '월별요약손익계산서(추정)');
    console.log(`B5 해결 결과: ${JSON.stringify(b5Value)}`);
    
    // B5 참조 체인 추적
    console.log('\n=== B5 참조 체인 추적 ===');
    const b5Raw = summarySheet[4]?.[1]; // B5의 원본 값
    console.log(`B5 원본 값: ${JSON.stringify(b5Raw)}`);
    
    if (typeof b5Raw === 'string' && b5Raw.startsWith('=')) {
      const formula = b5Raw.substring(1);
      console.log(`B5 수식: ${formula}`);
      
      const intermediateValue = engine.resolveExcelCellReference(formula, '월별요약손익계산서(추정)');
      console.log(`중간 참조 결과: ${JSON.stringify(intermediateValue)}`);
    }

    // 매출내역total O6 직접 확인
    console.log('\n=== 매출내역total 시트 확인 ===');
    const revenueSheet = sheets['매출내역total'];
    console.log(`매출내역total 시트 행수: ${revenueSheet.length}`);
    
    // O6는 6행 15열 (인덱스 5, 14)
    if (revenueSheet[5]) {
      const o6Value = revenueSheet[5][14];
      console.log(`매출내역total O6: ${JSON.stringify(o6Value)}`);
      
      if (typeof o6Value === 'string' && o6Value.startsWith('=')) {
        const formula = o6Value.substring(1);
        console.log(`O6 수식: ${formula}`);
        
        const finalValue = engine.resolveExcelCellReference(formula, '매출내역total');
        console.log(`최종 해결 결과: ${JSON.stringify(finalValue)}`);
      }
    }

    // 범위 데이터 테스트
    console.log('\n=== 범위 데이터 테스트 ===');
    
    const gRangeData = engine.getExcelRangeData('매출내역total!$G:$G');
    console.log(`G열 데이터 수: ${gRangeData.length}`);
    console.log(`G열 처음 5개: ${JSON.stringify(gRangeData.slice(0, 5))}`);
    
    const aRangeData = engine.getExcelRangeData('매출내역total!$A:$A');
    console.log(`A열 데이터 수: ${aRangeData.length}`);
    console.log(`A열 처음 5개: ${JSON.stringify(aRangeData.slice(0, 5))}`);
    
    const jRangeData = engine.getExcelRangeData('매출내역total!$J:$J');
    console.log(`J열 데이터 수: ${jRangeData.length}`);
    console.log(`J열 처음 5개: ${JSON.stringify(jRangeData.slice(0, 5))}`);

  } catch (error) {
    console.error('상세 디버깅 중 오류:', error);
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  detailedDebug().catch(console.error);
}

module.exports = { detailedDebug };
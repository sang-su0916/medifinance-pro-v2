#!/usr/bin/env node

/**
 * SUMIFS 불일치 원인 분석 및 디버깅 스크립트
 */

const CalculationEngine = require('./src/engines/CalculationEngine');
const XLSX = require('xlsx');
const path = require('path');

async function debugSUMIFS() {
  console.log('=== SUMIFS 불일치 원인 분석 ===\n');

  const excelPath = path.join(__dirname, '..', 'decrypted_sample.xlsx');
  
  try {
    // 1. Excel 데이터 로드
    const workbook = XLSX.readFile(excelPath, { cellFormula: true });
    
    console.log('=== 매출내역total 시트 분석 ===');
    const revenueSheet = workbook.Sheets['매출내역total'];
    
    // 실제 데이터 확인 (처음 15행)
    for (let row = 1; row <= 15; row++) {
      const A = revenueSheet[`A${row}`]?.v; // 월
      const G = revenueSheet[`G${row}`]?.v; // 계 (금액)
      const J = revenueSheet[`J${row}`]?.v; // 계정과목
      console.log(`Row ${row}: A=${A}, G=${G}, J=${J}`);
    }

    console.log('\n=== 월별요약손익계산서(추정) 조건값 분석 ===');
    const summarySheet = workbook.Sheets['월별요약손익계산서(추정)'];
    
    // C2, D2 (월 조건)
    console.log(`C2 (월 조건): ${summarySheet['C2']?.v}`);
    console.log(`D2 (월 조건): ${summarySheet['D2']?.v}`);
    
    // B3, B4, B5 (계정과목 조건) 
    console.log(`B3 (계정 조건): ${summarySheet['B3']?.f} = ${summarySheet['B3']?.v}`);
    console.log(`B4 (계정 조건): ${summarySheet['B4']?.f} = ${summarySheet['B4']?.v}`);
    console.log(`B5 (계정 조건): ${summarySheet['B5']?.f} = ${summarySheet['B5']?.v}`);

    console.log('\n=== 사업장요약현황 O열 확인 ===');
    const businessSheet = workbook.Sheets['사업장요약현황'];
    for (let row = 4; row <= 10; row++) {
      const value = businessSheet[`O${row}`]?.v;
      console.log(`O${row}: ${value}`);
    }

    console.log('\n=== C5 수식 상세 분석 ===');
    // SUMIFS(매출내역total!$G:$G,매출내역total!$A:$A,C$2,매출내역total!$J:$J,$B5)
    const C5Formula = summarySheet['C5']?.f;
    const C5Result = summarySheet['C5']?.v;
    console.log(`C5 수식: ${C5Formula}`);
    console.log(`C5 Excel 결과: ${C5Result}`);

    // 조건값들 확인
    const monthCondition = summarySheet['C2']?.v; // 1
    const accountCondition = summarySheet['B5']?.v; // 기타수입 (사업장요약현황!O7 참조)
    
    console.log(`월 조건 (C2): ${monthCondition}`);
    console.log(`계정 조건 (B5): ${accountCondition}`);

    // 매출내역total에서 조건에 맞는 데이터 찾기
    console.log('\n=== 매출내역total에서 조건 매칭 확인 ===');
    let manualSum = 0;
    let matchCount = 0;

    for (let row = 4; row <= 15; row++) { // 데이터 행들
      const month = revenueSheet[`A${row}`]?.v;
      const amount = revenueSheet[`G${row}`]?.v;
      const account = revenueSheet[`J${row}`]?.v;
      
      console.log(`Row ${row}: 월=${month}, 계정=${account}, 금액=${amount}`);
      
      if (month == monthCondition && account == accountCondition) {
        manualSum += (amount || 0);
        matchCount++;
        console.log(`  ✅ 매칭! 누적합: ${manualSum}`);
      }
    }

    console.log(`\n수동 계산 결과:`);
    console.log(`매칭 건수: ${matchCount}`);
    console.log(`합계: ${manualSum}`);
    console.log(`Excel 결과: ${C5Result}`);
    console.log(`일치 여부: ${manualSum === C5Result}`);

    // 2. JavaScript 엔진으로 계산 비교
    console.log('\n=== JavaScript 엔진 계산 비교 ===');
    
    const engine = new CalculationEngine();
    
    // Excel 데이터 로드
    const sheets = {};
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, 
        raw: false,
        defval: null 
      });
      sheets[sheetName] = data;
      engine.sheetData.set(sheetName, data);
    });

    // 계정과목 매핑 생성
    await engine.createAccountMappings();

    // C5 수식 실행
    const testFormula = {
      sheet: '월별요약손익계산서(추정)',
      cell: 'C5',
      formula: C5Formula
    };

    const jsResult = await engine.executeSUMIFS_Enhanced(testFormula);
    console.log(`JavaScript 결과: ${jsResult}`);
    console.log(`Excel 결과: ${C5Result}`);
    console.log(`차이: ${Math.abs(jsResult - C5Result)}`);

    // 3. 상세 디버깅
    console.log('\n=== 상세 디버깅 ===');
    
    // SUMIFS 파싱 결과 확인
    const parsed = engine.parseSUMIFS_Enhanced(C5Formula);
    console.log('SUMIFS 파싱 결과:', JSON.stringify(parsed, null, 2));

    // 조건값 해결 과정 확인
    console.log('\n조건값 해결:');
    parsed.conditions.forEach((condition, index) => {
      const resolvedCriteria = engine.resolveExcelCellReference(condition.criteria, '월별요약손익계산서(추정)');
      console.log(`조건 ${index + 1}: ${condition.criteria} → ${resolvedCriteria}`);
    });

    // 범위 데이터 확인
    console.log('\n범위 데이터 확인:');
    const sumRangeData = engine.getExcelRangeData(parsed.sumRange);
    const condition1Data = engine.getExcelRangeData(parsed.conditions[0].range);
    const condition2Data = engine.getExcelRangeData(parsed.conditions[1].range);
    
    console.log(`합계 범위 (${parsed.sumRange}): ${sumRangeData.length}개 데이터`);
    console.log(`조건1 범위 (${parsed.conditions[0].range}): ${condition1Data.length}개 데이터`);
    console.log(`조건2 범위 (${parsed.conditions[1].range}): ${condition2Data.length}개 데이터`);

    // 처음 10개 데이터 비교
    console.log('\n처음 10개 데이터 비교:');
    for (let i = 0; i < Math.min(10, sumRangeData.length); i++) {
      console.log(`[${i}] 합계:${sumRangeData[i]}, 조건1:${condition1Data[i]}, 조건2:${condition2Data[i]}`);
    }

  } catch (error) {
    console.error('디버깅 중 오류 발생:', error);
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  debugSUMIFS().catch(console.error);
}

module.exports = { debugSUMIFS };
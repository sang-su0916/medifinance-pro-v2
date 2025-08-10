#!/usr/bin/env node

/**
 * SUMIFS 계산 단계별 디버깅
 */

const EnhancedEngine = require('./src/engines/EnhancedCalculationEngine.js');
const path = require('path');

async function debugSUMIFSStep() {
  console.log('=== SUMIFS 계산 단계별 디버깅 ===\n');

  try {
    const engine = new EnhancedEngine();
    const excelPath = path.join(__dirname, '..', 'decrypted_sample.xlsx');
    await engine.loadExcelFile(excelPath);

    // 테스트 수식
    const testFormula = {
      sheet: '월별요약손익계산서(추정)',
      cell: 'C5',
      formula: 'SUMIFS(매출내역total!$G:$G,매출내역total!$A:$A,C$2,매출내역total!$J:$J,$B5)',
      value: 52223360
    };

    console.log('1. 수식 파싱 테스트');
    console.log('원본 수식:', testFormula.formula);
    
    const parsed = engine.parseSUMIFS(testFormula.formula);
    console.log('파싱 결과:', JSON.stringify(parsed, null, 2));

    console.log('\n2. 조건 값 해결');
    
    // C$2 해결
    const condition1 = engine.resolveCellReference('C$2', testFormula.sheet);
    console.log('C$2 해결 결과:', condition1);

    // $B5 해결
    const condition2 = engine.resolveCellReference('$B5', testFormula.sheet);
    console.log('$B5 해결 결과:', condition2);

    console.log('\n3. 범위 데이터 가져오기');
    
    // 합계 범위 (G열)
    const sumRangeData = engine.getRangeValues('매출내역total!$G:$G');
    console.log('G열 데이터 (처음 10개):', sumRangeData.slice(0, 10));
    console.log('G열 데이터 총 개수:', sumRangeData.length);

    // 조건 범위 1 (A열)
    const criteriaRange1Data = engine.getRangeValues('매출내역total!$A:$A');
    console.log('A열 데이터 (처음 10개):', criteriaRange1Data.slice(0, 10));
    console.log('A열 데이터 총 개수:', criteriaRange1Data.length);

    // 조건 범위 2 (J열)
    const criteriaRange2Data = engine.getRangeValues('매출내역total!$J:$J');
    console.log('J열 데이터 (처음 10개):', criteriaRange2Data.slice(0, 10));
    console.log('J열 데이터 총 개수:', criteriaRange2Data.length);

    console.log('\n4. 조건 매칭 테스트');
    const dataLength = Math.min(sumRangeData.length, criteriaRange1Data.length, criteriaRange2Data.length);
    console.log('처리할 데이터 길이:', dataLength);

    let matchCount = 0;
    let totalSum = 0;

    for (let i = 0; i < dataLength; i++) {
      const aValue = criteriaRange1Data[i];
      const jValue = criteriaRange2Data[i];
      const gValue = sumRangeData[i];

      const matchesCondition1 = engine.matchesCriteria(aValue, condition1);
      const matchesCondition2 = engine.matchesCriteria(jValue, condition2);
      const matchesBoth = matchesCondition1 && matchesCondition2;

      console.log(`Row ${i}: A=${aValue} (${matchesCondition1}), J=${jValue} (${matchesCondition2}), G=${gValue}, 매칭=${matchesBoth}`);

      if (matchesBoth) {
        matchCount++;
        const numericValue = engine.parseNumericValue(gValue);
        totalSum += numericValue;
        console.log(`  ✅ 매칭! 누적 합계: ${totalSum}`);
      }
    }

    console.log(`\n최종 결과:`);
    console.log(`매칭 행 수: ${matchCount}`);
    console.log(`합계: ${totalSum}`);
    console.log(`예상값: ${testFormula.value}`);
    console.log(`일치 여부: ${totalSum === testFormula.value}`);

  } catch (error) {
    console.error('오류 발생:', error);
    console.error('스택:', error.stack);
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  debugSUMIFSStep().catch(console.error);
}

module.exports = { debugSUMIFSStep };
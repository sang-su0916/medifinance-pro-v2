#!/usr/bin/env node

/**
 * SUMIFS 계산 엔진 테스트 스크립트
 * Excel decrypted_sample.xlsx의 실제 SUMIFS 결과와 JavaScript 계산 결과 비교
 */

const CalculationEngine = require('./src/engines/CalculationEngine');

async function testSUMIFS() {
  console.log('=== SUMIFS 계산 엔진 테스트 시작 ===\n');

  const engine = new CalculationEngine();

  // 샘플 분류된 데이터 (실제 Excel 구조를 모방)
  const mockClassifiedData = {
    classified: [
      {
        account: '소모품비',
        originalData: { 거래처: '삼성카드', 항목: '사무용품' },
        metadata: { month: 1, day: 5, amount: 50000, date: '2023-01-05' }
      },
      {
        account: '접대비',
        originalData: { 거래처: '음식점', 항목: '식사' },
        metadata: { month: 3, day: 10, amount: 80000, date: '2023-03-10' }
      },
      {
        account: '의약품비',
        originalData: { 거래처: '제약회사', 항목: '의약품' },
        metadata: { month: 1, day: 15, amount: 120000, date: '2023-01-15' }
      },
      {
        account: '복리후생비',
        originalData: { 거래처: '보험회사', 항목: '보험료' },
        metadata: { month: 2, day: 20, amount: 200000, date: '2023-02-20' }
      }
    ]
  };

  try {
    // 1. Excel 구조 준비
    await engine.prepareExcelCompatibleData(mockClassifiedData);

    // 2. 테스트할 SUMIFS 수식들
    const testFormulas = [
      {
        sheet: '월별요약손익계산서(추정)',
        cell: 'C3',
        formula: 'SUMIFS(매출내역total!$G:$G,매출내역total!$A:$A,C$2,매출내역total!$J:$J,$B3)'
      },
      {
        sheet: '월별요약손익계산서(추정)',
        cell: 'C8',
        formula: 'SUMIFS(출!$G:$G,출!$A:$A,C$2,출!$J:$J,$B8)'
      },
      {
        sheet: '월별요약손익계산서(추정)',
        cell: 'D8',
        formula: 'SUMIFS(출!$G:$G,출!$A:$A,D$2,출!$J:$J,$B8)'
      }
    ];

    console.log('테스트할 SUMIFS 수식 목록:');
    testFormulas.forEach((formula, index) => {
      console.log(`${index + 1}. [${formula.sheet}!${formula.cell}] ${formula.formula}`);
    });

    console.log('\n=== 계산 실행 ===');
    
    // 3. 각 수식 실행 및 결과 출력
    for (const formula of testFormulas) {
      try {
        console.log(`\n--- ${formula.sheet}!${formula.cell} 계산 중 ---`);
        console.log(`수식: ${formula.formula}`);
        
        const result = await engine.executeSUMIFS_Enhanced(formula);
        
        console.log(`결과: ${result}`);
        console.log('✅ 계산 성공');
        
      } catch (error) {
        console.log(`❌ 계산 실패: ${error.message}`);
      }
    }

    // 4. 전체 SUMIFS 실행 테스트
    console.log('\n=== 전체 SUMIFS 계산 테스트 ===');
    
    const results = await engine.executeCalculations(mockClassifiedData, testFormulas);
    
    console.log(`\n=== 최종 결과 ===`);
    console.log(`총 수식: ${results.totalFormulas}개`);
    console.log(`성공: ${results.formulasExecuted}개`);
    console.log(`실패: ${results.errors.length}개`);
    console.log(`정확도: ${results.accuracy}%`);
    console.log(`처리 시간: ${results.processingTime}ms`);

    if (results.errors.length > 0) {
      console.log('\n--- 오류 목록 ---');
      results.errors.forEach((error, index) => {
        console.log(`${index + 1}. [${error.sheet}!${error.cell}] ${error.error}`);
      });
    }

    console.log('\n--- 계산 결과 상세 ---');
    Object.keys(results.calculationResults).forEach(key => {
      const result = results.calculationResults[key];
      console.log(`${key}: ${result.result} (${result.formula})`);
    });

  } catch (error) {
    console.error('테스트 실행 중 오류 발생:', error);
  }

  console.log('\n=== SUMIFS 계산 엔진 테스트 완료 ===');
}

// 스크립트 직접 실행 시
if (require.main === module) {
  testSUMIFS().catch(console.error);
}

module.exports = { testSUMIFS };
#!/usr/bin/env node

const EnhancedEngine = require('./src/engines/EnhancedCalculationEngine.js');
const { extractAllSUMIFS } = require('./extract_all_sumifs.js');
const path = require('path');

async function test50Formulas() {
  console.log('=== 처음 50개 SUMIFS 수식 테스트 ===\n');

  try {
    // 1. 엔진 초기화
    const engine = new EnhancedEngine();
    const excelPath = path.join(__dirname, '..', 'decrypted_sample.xlsx');
    await engine.loadExcelFile(excelPath);

    // 2. 수식 추출
    const allFormulas = await extractAllSUMIFS();
    const testFormulas = allFormulas.slice(0, 50);

    console.log(`\n테스트 진행: 처음 50개 수식\n`);

    // 3. 결과 초기화
    const results = {
      totalFormulas: testFormulas.length,
      successCount: 0,
      errorCount: 0,
      exactMatches: 0,
      errors: [],
      comparisons: []
    };

    const startTime = Date.now();

    // 4. 각 수식 테스트
    for (let i = 0; i < testFormulas.length; i++) {
      const formula = testFormulas[i];
      
      try {
        const jsResult = engine.executeSUMIFS(formula);
        const excelResult = formula.value || 0;
        
        results.successCount++;
        
        // 정확도 비교 (소수점 둘째 자리까지)
        const jsRounded = Math.round(jsResult * 100) / 100;
        const excelRounded = Math.round(excelResult * 100) / 100;
        const isExactMatch = jsRounded === excelRounded;
        
        if (isExactMatch) {
          results.exactMatches++;
        }

        results.comparisons.push({
          sheet: formula.sheet,
          cell: formula.cell,
          formula: formula.formula,
          jsResult: jsRounded,
          excelResult: excelRounded,
          match: isExactMatch
        });

        // 진행률 표시
        if (i % 10 === 0 || i === testFormulas.length - 1) {
          console.log(`진행률: ${i + 1}/${testFormulas.length} (${(((i + 1) / testFormulas.length) * 100).toFixed(1)}%)`);
        }

      } catch (error) {
        results.errorCount++;
        results.errors.push({
          sheet: formula.sheet,
          cell: formula.cell,
          formula: formula.formula,
          error: error.message
        });
      }
    }

    const processingTime = Date.now() - startTime;
    const accuracy = (results.exactMatches / results.totalFormulas * 100).toFixed(2);

    console.log(`\n=== 최종 결과 ===`);
    console.log(`총 수식: ${results.totalFormulas}개`);
    console.log(`성공: ${results.successCount}개`);
    console.log(`실패: ${results.errorCount}개`);
    console.log(`정확한 매칭: ${results.exactMatches}개`);
    console.log(`정확도: ${accuracy}%`);
    console.log(`처리 시간: ${processingTime}ms`);

    // 불일치 사례 분석
    const mismatches = results.comparisons.filter(c => !c.match);
    if (mismatches.length > 0) {
      console.log(`\n불일치 사례 (처음 5개):`);
      mismatches.slice(0, 5).forEach((mismatch, index) => {
        console.log(`${index + 1}. [${mismatch.sheet}!${mismatch.cell}]`);
        console.log(`   JavaScript: ${mismatch.jsResult}`);
        console.log(`   Excel: ${mismatch.excelResult}`);
        console.log(`   차이: ${Math.abs(mismatch.jsResult - mismatch.excelResult)}`);
      });
    }

    // 오류 사례 분석
    if (results.errors.length > 0) {
      console.log(`\n오류 사례 (처음 5개):`);
      results.errors.slice(0, 5).forEach((error, index) => {
        console.log(`${index + 1}. [${error.sheet}!${error.cell}] ${error.error}`);
      });
    }

    if (accuracy >= 95) {
      console.log('\n🎉 테스트 성공: 95% 이상 정확도 달성!');
    } else if (accuracy >= 90) {
      console.log('\n✅ 테스트 양호: 90% 이상 정확도');
    } else {
      console.log('\n⚠️  추가 개선 필요');
    }

    return results;

  } catch (error) {
    console.error('테스트 실행 중 오류:', error);
    throw error;
  }
}

test50Formulas().catch(console.error);
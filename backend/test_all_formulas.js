#!/usr/bin/env node

const EnhancedEngine = require('./src/engines/EnhancedCalculationEngine.js');
const path = require('path');

async function testAllFormulas() {
  console.log('=== SUMIFS 전체 수식 테스트 ===\n');

  try {
    const engine = new EnhancedEngine();
    const excelPath = path.join(__dirname, '..', 'decrypted_sample.xlsx');
    await engine.loadExcelFile(excelPath);

    // 수식 추출 (간단한 방식)
    const formulas = [
      {
        sheet: '월별요약손익계산서(추정)',
        cell: 'C5',
        formula: 'SUMIFS(매출내역total!$G:$G,매출내역total!$A:$A,C$2,매출내역total!$J:$J,$B5)',
        value: 52223360
      },
      {
        sheet: '월별요약손익계산서(추정)',
        cell: 'D5',
        formula: 'SUMIFS(매출내역total!$G:$G,매출내역total!$A:$A,D$2,매출내역total!$J:$J,$B5)',
        value: 47453480
      },
      {
        sheet: '월별요약손익계산서(추정)',
        cell: 'E5',
        formula: 'SUMIFS(매출내역total!$G:$G,매출내역total!$A:$A,E$2,매출내역total!$J:$J,$B5)',
        value: 47316780
      }
    ];

    console.log(`테스트할 수식: ${formulas.length}개\n`);

    let successCount = 0;
    let exactMatches = 0;

    for (let i = 0; i < formulas.length; i++) {
      const formula = formulas[i];
      
      try {
        console.log(`${i + 1}. [${formula.sheet}!${formula.cell}]`);
        console.log(`   수식: ${formula.formula}`);
        console.log(`   Excel 결과: ${formula.value}`);
        
        const jsResult = engine.executeSUMIFS(formula);
        console.log(`   JavaScript 결과: ${jsResult}`);
        
        successCount++;
        const match = jsResult === formula.value;
        if (match) exactMatches++;
        
        console.log(`   매칭: ${match ? '✅' : '❌'}`);
        if (!match) {
          console.log(`   차이: ${Math.abs(jsResult - formula.value)}`);
        }
        console.log('');
        
      } catch (error) {
        console.log(`   ❌ 오류: ${error.message}\n`);
      }
    }

    const accuracy = (exactMatches / formulas.length * 100).toFixed(2);

    console.log('=== 최종 결과 ===');
    console.log(`총 수식: ${formulas.length}개`);
    console.log(`성공: ${successCount}개`);
    console.log(`정확한 매칭: ${exactMatches}개`);
    console.log(`정확도: ${accuracy}%`);

    if (accuracy >= 95) {
      console.log('\n🎉 테스트 성공: 95% 이상 정확도 달성!');
    } else {
      console.log('\n⚠️  추가 개선 필요');
    }

  } catch (error) {
    console.error('테스트 실행 중 오류:', error);
    console.error('스택:', error.stack);
  }
}

testAllFormulas().catch(console.error);
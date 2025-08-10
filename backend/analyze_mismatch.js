#!/usr/bin/env node

const EnhancedEngine = require('./src/engines/EnhancedCalculationEngine.js');
const path = require('path');

async function analyzeMismatch() {
  console.log('=== D8 셀 불일치 분석 ===\n');

  try {
    const engine = new EnhancedEngine();
    const excelPath = path.join(__dirname, '..', 'decrypted_sample.xlsx');
    await engine.loadExcelFile(excelPath);

    // D8 셀 분석
    const formula = {
      sheet: '월별요약손익계산서(추정)',
      cell: 'D8',
      formula: 'SUMIFS(매출내역total!$G:$G,매출내역total!$A:$A,D$2,매출내역total!$J:$J,$B8)',
      value: 1409680
    };

    console.log('수식 정보:');
    console.log(`  셀: ${formula.cell}`);
    console.log(`  수식: ${formula.formula}`);
    console.log(`  Excel 예상값: ${formula.value}`);

    // 조건 분석
    console.log('\n조건 분석:');
    const condition1 = engine.resolveCellReference('D$2', formula.sheet);
    console.log(`  D$2 (월 조건): ${condition1}`);
    
    const condition2 = engine.resolveCellReference('$B8', formula.sheet);
    console.log(`  $B8 (계정 조건): ${condition2}`);

    // 매출내역total에서 해당 조건 데이터 찾기
    console.log('\n매출내역total 시트에서 매칭 데이터:');
    const revenueSheet = engine.workbook.Sheets['매출내역total'];
    
    for (let row = 4; row <= 15; row++) {
      const aValue = revenueSheet[`A${row}`]?.v;
      const jValue = revenueSheet[`J${row}`]?.v; 
      const gValue = revenueSheet[`G${row}`]?.v;
      
      if (aValue === condition1 && jValue === condition2) {
        console.log(`  행 ${row}: A=${aValue}, J=${jValue}, G=${gValue} ✅ 매칭`);
      } else if (aValue === condition1 || jValue === condition2) {
        console.log(`  행 ${row}: A=${aValue}, J=${jValue}, G=${gValue} (부분매칭)`);
      }
    }

    // JavaScript 계산 실행
    console.log('\n계산 실행:');
    const jsResult = engine.executeSUMIFS(formula);
    console.log(`  JavaScript 결과: ${jsResult}`);
    console.log(`  Excel 결과: ${formula.value}`);
    console.log(`  일치 여부: ${jsResult === formula.value ? '✅' : '❌'}`);
    console.log(`  차이: ${Math.abs(jsResult - formula.value)}`);

    // B8셀의 실제 값 확인
    console.log('\nB8 셀 상세 분석:');
    const b8Cell = engine.workbook.Sheets['월별요약손익계산서(추정)']['B8'];
    console.log(`  B8 셀 데이터:`, b8Cell);

  } catch (error) {
    console.error('분석 중 오류:', error);
  }
}

analyzeMismatch().catch(console.error);
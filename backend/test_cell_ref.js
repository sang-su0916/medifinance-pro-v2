#!/usr/bin/env node

const EnhancedEngine = require('./src/engines/EnhancedCalculationEngine.js');
const path = require('path');

async function testCellRef() {
  console.log('=== 셀 참조 테스트 ===\n');

  try {
    const engine = new EnhancedEngine();
    const excelPath = path.join(__dirname, '..', 'decrypted_sample.xlsx');
    await engine.loadExcelFile(excelPath);

    console.log('1. 직접 셀 접근 테스트');
    const sheet = engine.workbook.Sheets['월별요약손익계산서(추정)'];
    console.log('C2:', sheet['C2']);
    console.log('B5:', sheet['B5']);

    console.log('\n2. parseRange 테스트');
    const range1 = engine.parseRange('매출내역total!$G:$G');
    console.log('매출내역total!$G:$G ->', range1);

    const range2 = engine.parseRange('매출내역total!$A:$A');
    console.log('매출내역total!$A:$A ->', range2);

    console.log('\n3. resolveCellReference 테스트');
    const val1 = engine.resolveCellReference('C2', '월별요약손익계산서(추정)');
    console.log('C2 (월별요약손익계산서) ->', val1);

    const val2 = engine.resolveCellReference('B5', '월별요약손익계산서(추정)');
    console.log('B5 (월별요약손익계산서) ->', val2);

  } catch (error) {
    console.error('테스트 중 오류:', error);
  }
}

testCellRef().catch(console.error);
#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

async function verifyOutputSheet() {
  console.log('=== 출 시트 검증 ===\n');

  try {
    const excelPath = path.join(__dirname, '..', 'decrypted_sample.xlsx');
    const workbook = XLSX.readFile(excelPath, { cellFormula: true });

    const outputSheet = workbook.Sheets['출'];
    
    console.log('1. 출 시트 A열과 J열 (처음 20행):');
    for (let row = 1; row <= 20; row++) {
      const aCell = outputSheet[`A${row}`];
      const jCell = outputSheet[`J${row}`];
      const gCell = outputSheet[`G${row}`];
      
      console.log(`  행 ${row}: A="${aCell?.v || ''}", J="${jCell?.v || ''}", G="${gCell?.v || ''}"`);
    }

    console.log('\n2. 출 시트에서 A=2이면서 J=매출원가인 데이터 검색:');
    
    let found = false;
    for (let row = 4; row <= 100; row++) {
      const aValue = outputSheet[`A${row}`]?.v;
      const jValue = outputSheet[`J${row}`]?.v;
      const gValue = outputSheet[`G${row}`]?.v;
      
      if (aValue === 2 && jValue === '매출원가') {
        console.log(`  ✅ 매칭 발견! 행 ${row}: A=${aValue}, J=${jValue}, G=${gValue}`);
        found = true;
      }
    }
    
    if (!found) {
      console.log('  매칭되는 데이터를 찾지 못했습니다.');
      
      console.log('\n3. 출 시트의 A열 값 분포 분석:');
      const aValues = new Set();
      for (let row = 4; row <= 50; row++) {
        const aValue = outputSheet[`A${row}`]?.v;
        if (aValue) aValues.add(aValue);
      }
      console.log(`  A열 값들: ${[...aValues].sort()}`);
      
      console.log('\n4. 출 시트의 J열에서 "매출원가" 발견된 행들:');
      for (let row = 4; row <= 50; row++) {
        const jValue = outputSheet[`J${row}`]?.v;
        if (jValue === '매출원가') {
          const aValue = outputSheet[`A${row}`]?.v;
          const gValue = outputSheet[`G${row}`]?.v;
          console.log(`    행 ${row}: A=${aValue}, J=${jValue}, G=${gValue}`);
        }
      }
    }

    // Excel D8 셀의 실제 수식이 올바른 시트를 참조하는지 확인
    console.log('\n5. D8 수식이 참조해야 할 시트 확인:');
    const d8Formula = 'SUMIFS(매출내역total!$G:$G,매출내역total!$A:$A,D$2,매출내역total!$J:$J,$B8)';
    console.log(`  현재 수식: ${d8Formula}`);
    console.log('  문제: 매출원가는 매출내역total이 아닌 출 시트에 있음');
    console.log('  올바른 수식: SUMIFS(출!$G:$G,출!$A:$A,D$2,출!$J:$J,$B8)');

  } catch (error) {
    console.error('검증 중 오류:', error);
  }
}

verifyOutputSheet().catch(console.error);
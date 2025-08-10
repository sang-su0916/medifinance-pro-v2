#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

async function findAllSalesCost() {
  console.log('=== 출 시트의 모든 매출원가 데이터 검색 ===\n');

  try {
    const excelPath = path.join(__dirname, '..', 'decrypted_sample.xlsx');
    const workbook = XLSX.readFile(excelPath, { cellFormula: true });

    const outputSheet = workbook.Sheets['출'];
    
    console.log('1. A=2이면서 J=매출원가인 모든 데이터:');
    let total = 0;
    let count = 0;
    
    for (let row = 4; row <= 2000; row++) { // 더 넓은 범위 검색
      const aValue = outputSheet[`A${row}`]?.v;
      const jValue = outputSheet[`J${row}`]?.v;
      const gValue = outputSheet[`G${row}`]?.v;
      
      if (aValue === 2 && jValue === '매출원가') {
        console.log(`  행 ${row}: A=${aValue}, J=${jValue}, G=${gValue}`);
        if (gValue && !isNaN(gValue)) {
          total += gValue;
          count++;
        }
      }
    }
    
    console.log(`\n2. 합계 결과:`);
    console.log(`  매칭 건수: ${count}개`);
    console.log(`  JavaScript 합계: ${total}`);
    console.log(`  Excel 예상값: 1409680`);
    console.log(`  일치 여부: ${total === 1409680 ? '✅' : '❌'}`);
    console.log(`  차이: ${Math.abs(total - 1409680)}`);

    if (total !== 1409680) {
      console.log('\n3. 추가 분석 - 2월의 모든 매출원가 관련 항목:');
      const possibleItems = ['매출원가', '원가'];
      
      for (const item of possibleItems) {
        console.log(`\n"${item}" 검색:`);
        let itemTotal = 0;
        let itemCount = 0;
        
        for (let row = 4; row <= 2000; row++) {
          const aValue = outputSheet[`A${row}`]?.v;
          const jValue = outputSheet[`J${row}`]?.v;
          const gValue = outputSheet[`G${row}`]?.v;
          
          if (aValue === 2 && jValue && jValue.includes(item)) {
            console.log(`  행 ${row}: A=${aValue}, J=${jValue}, G=${gValue}`);
            if (gValue && !isNaN(gValue)) {
              itemTotal += gValue;
              itemCount++;
            }
          }
        }
        
        console.log(`  "${item}" 합계: ${itemTotal} (${itemCount}건)`);
      }
    }

  } catch (error) {
    console.error('검색 중 오류:', error);
  }
}

findAllSalesCost().catch(console.error);
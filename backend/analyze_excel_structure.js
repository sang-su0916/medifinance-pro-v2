#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

async function analyzeExcelStructure() {
  console.log('=== Excel 구조 심층 분석 ===\n');

  try {
    const excelPath = path.join(__dirname, '..', 'decrypted_sample.xlsx');
    const workbook = XLSX.readFile(excelPath, { cellFormula: true });

    console.log('1. 전체 시트 목록:');
    workbook.SheetNames.forEach((name, index) => {
      console.log(`  ${index + 1}. ${name}`);
    });

    console.log('\n2. 매출내역total 시트 J열 (계정과목) 분석:');
    const revenueSheet = workbook.Sheets['매출내역total'];
    
    // J열의 모든 값을 확인 (넓은 범위)
    for (let row = 1; row <= 30; row++) {
      const cell = revenueSheet[`J${row}`];
      if (cell) {
        console.log(`  J${row}: "${cell.v}" (타입: ${cell.t}, 수식: ${cell.f || '없음'})`);
      }
    }

    console.log('\n3. 다른 시트에서 "매출원가" 검색:');
    
    // 모든 시트에서 "매출원가" 텍스트 검색
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      
      Object.keys(sheet).forEach(cellAddress => {
        if (cellAddress.startsWith('!')) return;
        
        const cell = sheet[cellAddress];
        if (cell.v && typeof cell.v === 'string' && cell.v.includes('매출원가')) {
          console.log(`  [${sheetName}!${cellAddress}] "${cell.v}" (수식: ${cell.f || '없음'})`);
        }
      });
    });

    console.log('\n4. 출 시트 분석 (B8이 참조하는 시트):');
    const outputSheet = workbook.Sheets['출'];
    if (outputSheet) {
      // O열 확인
      for (let row = 1; row <= 20; row++) {
        const cell = outputSheet[`O${row}`];
        if (cell) {
          console.log(`  출!O${row}: "${cell.v}" (타입: ${cell.t}, 수식: ${cell.f || '없음'})`);
        }
      }
    } else {
      console.log('  출 시트를 찾을 수 없습니다.');
    }

    console.log('\n5. 월별요약손익계산서 B열 분석:');
    const summarySheet = workbook.Sheets['월별요약손익계산서(추정)'];
    
    for (let row = 3; row <= 15; row++) {
      const cell = summarySheet[`B${row}`];
      if (cell) {
        console.log(`  B${row}: "${cell.v}" (수식: ${cell.f || '없음'})`);
      }
    }

  } catch (error) {
    console.error('분석 중 오류:', error);
  }
}

analyzeExcelStructure().catch(console.error);
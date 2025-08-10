#!/usr/bin/env node

/**
 * 매출내역total 시트의 A열과 J열 데이터 분석
 */

const XLSX = require('xlsx');
const path = require('path');

async function debugAJColumns() {
  console.log('=== 매출내역total 시트 A열과 J열 데이터 분석 ===\n');

  const excelPath = path.join(__dirname, '..', 'decrypted_sample.xlsx');
  
  try {
    const workbook = XLSX.readFile(excelPath, { 
      cellFormula: true,
      cellText: false,
      cellDates: false
    });

    console.log('시트 목록:', workbook.SheetNames);
    
    const revenueSheet = workbook.Sheets['매출내역total'];
    if (!revenueSheet) {
      console.error('매출내역total 시트를 찾을 수 없습니다.');
      return;
    }

    console.log('\n=== A열 데이터 (1~20행) ===');
    for (let row = 1; row <= 20; row++) {
      const cellAddress = `A${row}`;
      const cell = revenueSheet[cellAddress];
      if (cell) {
        console.log(`${cellAddress}: 값="${cell.v}", 수식="${cell.f || '없음'}", 타입="${cell.t}"`);
      } else {
        console.log(`${cellAddress}: 빈 셀`);
      }
    }

    console.log('\n=== J열 데이터 (1~20행) ===');
    for (let row = 1; row <= 20; row++) {
      const cellAddress = `J${row}`;
      const cell = revenueSheet[cellAddress];
      if (cell) {
        console.log(`${cellAddress}: 값="${cell.v}", 수식="${cell.f || '없음'}", 타입="${cell.t}"`);
      } else {
        console.log(`${cellAddress}: 빈 셀`);
      }
    }

    console.log('\n=== G열 데이터 (1~20행) ===');
    for (let row = 1; row <= 20; row++) {
      const cellAddress = `G${row}`;
      const cell = revenueSheet[cellAddress];
      if (cell) {
        console.log(`${cellAddress}: 값="${cell.v}", 수식="${cell.f || '없음'}", 타입="${cell.t}"`);
      } else {
        console.log(`${cellAddress}: 빈 셀`);
      }
    }

    // 전체 시트의 셀 키들을 확인
    console.log('\n=== 시트의 모든 셀 키 확인 ===');
    const cellKeys = Object.keys(revenueSheet).filter(key => !key.startsWith('!'));
    console.log('총 셀 수:', cellKeys.length);
    console.log('처음 20개 셀:', cellKeys.slice(0, 20));
    console.log('마지막 20개 셀:', cellKeys.slice(-20));

    // A, G, J로 시작하는 셀들만 필터링
    const aColumns = cellKeys.filter(key => key.startsWith('A')).sort();
    const gColumns = cellKeys.filter(key => key.startsWith('G')).sort();
    const jColumns = cellKeys.filter(key => key.startsWith('J')).sort();

    console.log('\nA열 셀들:', aColumns.slice(0, 10), '...(총', aColumns.length, '개)');
    console.log('G열 셀들:', gColumns.slice(0, 10), '...(총', gColumns.length, '개)');
    console.log('J열 셀들:', jColumns.slice(0, 10), '...(총', jColumns.length, '개)');

  } catch (error) {
    console.error('분석 중 오류:', error);
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  debugAJColumns().catch(console.error);
}

module.exports = { debugAJColumns };
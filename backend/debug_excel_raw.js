#!/usr/bin/env node

/**
 * 원본 Excel 데이터 분석 - 수식과 실제 값을 분리해서 확인
 */

const XLSX = require('xlsx');
const path = require('path');

async function debugExcelRaw() {
  console.log('=== 원본 Excel 데이터 분석 ===\n');

  const excelPath = path.join(__dirname, '..', 'decrypted_sample.xlsx');
  
  try {
    // 수식과 값을 모두 읽을 수 있도록 설정
    const workbook = XLSX.readFile(excelPath, { 
      cellFormula: true,
      cellText: false,
      cellDates: false
    });

    console.log('=== 사업장요약현황 시트 원본 분석 ===');
    const businessSheet = workbook.Sheets['사업장요약현황'];
    
    // O열 데이터를 직접 셀 주소로 확인
    for (let row = 1; row <= 15; row++) {
      const cellAddress = `O${row}`;
      const cell = businessSheet[cellAddress];
      if (cell) {
        console.log(`${cellAddress}: 값="${cell.v}", 수식="${cell.f || '없음'}", 타입="${cell.t}"`);
      } else {
        console.log(`${cellAddress}: 셀 데이터 없음`);
      }
    }

    console.log('\\n=== 월별요약손익계산서(추정) 시트 조건값 분석 ===');
    const summarySheet = workbook.Sheets['월별요약손익계산서(추정)'];
    
    // C2, D2 (월 조건)
    const c2 = summarySheet['C2'];
    const d2 = summarySheet['D2'];
    console.log(`C2: 값="${c2?.v}", 수식="${c2?.f || '없음'}", 타입="${c2?.t}"`);
    console.log(`D2: 값="${d2?.v}", 수식="${d2?.f || '없음'}", 타입="${d2?.t}"`);

    // B3, B4, B5 (계정과목 조건)
    const b3 = summarySheet['B3'];
    const b4 = summarySheet['B4'];
    const b5 = summarySheet['B5'];
    console.log(`B3: 값="${b3?.v}", 수식="${b3?.f || '없음'}", 타입="${b3?.t}"`);
    console.log(`B4: 값="${b4?.v}", 수식="${b4?.f || '없음'}", 타입="${b4?.t}"`);
    console.log(`B5: 값="${b5?.v}", 수식="${b5?.f || '없음'}", 타입="${b5?.t}"`);

    console.log('\\n=== 매출내역total 시트 원본 분석 ===');
    const revenueSheet = workbook.Sheets['매출내역total'];
    
    // O열 확인
    for (let row = 4; row <= 8; row++) {
      const cellAddress = `O${row}`;
      const cell = revenueSheet[cellAddress];
      if (cell) {
        console.log(`${cellAddress}: 값="${cell.v}", 수식="${cell.f || '없음'}", 타입="${cell.t}"`);
      } else {
        console.log(`${cellAddress}: 셀 데이터 없음`);
      }
    }

    // G열 수식 확인
    console.log('\\n=== 매출내역total G열 수식 확인 ===');
    for (let row = 4; row <= 8; row++) {
      const cellAddress = `G${row}`;
      const cell = revenueSheet[cellAddress];
      if (cell) {
        console.log(`${cellAddress}: 값="${cell.v}", 수식="${cell.f || '없음'}", 타입="${cell.t}"`);
      }
    }

    console.log('\\n=== 테스트용 정확한 데이터 구조 생성 ===');
    
    // 정확한 데이터 구조 생성
    const correctData = {
      '사업장요약현황': {
        'O5': '보험진료수입',
        'O6': '일반진료수입', 
        'O7': '기타수입',
        'O8': '매출원가',
        'O9': '직원급여'
      },
      '월별요약손익계산서(추정)': {
        'C2': 1,
        'D2': 2,
        'E2': 3,
        'B3': '보험진료수입', // =매출내역total!O4 -> =사업장요약현황!O5
        'B4': '일반진료수입', // =매출내역total!O5 -> =사업장요약현황!O6  
        'B5': '기타수입'     // =매출내역total!O6 -> =사업장요약현황!O7
      },
      '매출내역total': {
        data: [
          { A: 1, G: 52223360, J: '기타수입' },
          { A: 2, G: 47453480, J: '기타수입' },
          { A: 3, G: 47316780, J: '기타수입' },
          { A: 4, G: 46397030, J: '기타수입' },
          { A: 5, G: 55632700, J: '기타수입' },
          { A: 6, G: 65324470, J: '기타수입' }
        ]
      }
    };

    console.log('정확한 데이터 구조:');
    console.log(JSON.stringify(correctData, null, 2));

    // 수동 SUMIFS 계산 검증
    console.log('\\n=== 수동 SUMIFS 계산 검증 ===');
    const monthCondition = 1;
    const accountCondition = '기타수입';
    
    let sum = 0;
    correctData['매출내역total'].data.forEach((row, index) => {
      console.log(`Row ${index}: A=${row.A}, J=${row.J}, G=${row.G}`);
      if (row.A === monthCondition && row.J === accountCondition) {
        sum += row.G;
        console.log(`  ✅ 매칭! 누적합: ${sum}`);
      }
    });
    
    console.log(`\\n최종 계산 결과: ${sum}`);
    console.log('Excel C5 예상 결과: 52223360');
    console.log(`일치 여부: ${sum === 52223360}`);

  } catch (error) {
    console.error('Excel 원본 분석 중 오류:', error);
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  debugExcelRaw().catch(console.error);
}

module.exports = { debugExcelRaw };
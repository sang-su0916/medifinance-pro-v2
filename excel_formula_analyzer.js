const ExcelJS = require('exceljs');

async function analyzeExcelFormulas() {
  console.log('🔥 === 자동화 Excel 수식 완전 분석 시작 ===');
  console.log('파일: 20230630 MVP 샘플.xlsx (자동화 Excel)');
  console.log('분석 시작:', new Date().toLocaleString('ko-KR'));
  console.log('');

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('decrypted_sample.xlsx');
    
    let totalFormulas = 0;
    let formulasByType = {};
    let formulasBySheet = {};
    let complexFormulas = [];
    let sheetReferences = {};
    
    console.log('📋 === 전체 시트 구조 분석 ===');
    workbook.worksheets.forEach((sheet, index) => {
      const sheetName = sheet.name;
      console.log(`${String(index + 1).padStart(2, '0')}. "${sheetName}"`);
      console.log(`    📏 실제 크기: ${sheet.actualRowCount}행 x ${sheet.actualColumnCount}열`);
      
      // 시트 유형 분류
      let sheetType = '기타';
      const name = sheetName.toLowerCase();
      if (name.includes('입력') || name.includes('데이터') || name.includes('원본') || name.includes('input')) {
        sheetType = '📥 입력 시트';
      } else if (name.includes('손익') || name.includes('pl') || name.includes('income')) {
        sheetType = '📊 손익계산서';
      } else if (name.includes('재무') || name.includes('bs') || name.includes('balance')) {
        sheetType = '📋 재무상태표';
      } else if (name.includes('분석') || name.includes('리포트') || name.includes('report')) {
        sheetType = '📈 분석 리포트';
      } else if (name.includes('설정') || name.includes('코드') || name.includes('매핑') || name.includes('master')) {
        sheetType = '⚙️ 설정/마스터';
      } else {
        sheetType = '🔢 계산 시트';
      }
      console.log(`    🏷️ 시트 유형: ${sheetType}`);
      
      // 첫 번째 행 헤더 확인
      if (sheet.actualRowCount > 0) {
        console.log('    📄 헤더 정보:');
        const firstRow = sheet.getRow(1);
        const headers = [];
        for (let col = 1; col <= Math.min(10, sheet.actualColumnCount); col++) {
          const cell = firstRow.getCell(col);
          if (cell.value) {
            headers.push(String(cell.value).substring(0, 12));
          }
        }
        console.log(`      ${headers.join(' | ')}`);
      }
      console.log('');
    });
    
    console.log('🔍 === 수식 상세 분석 시작 ===');
    
    workbook.worksheets.forEach((sheet, sheetIndex) => {
      const sheetName = sheet.name;
      let sheetFormulaCount = 0;
      formulasBySheet[sheetName] = 0;
      sheetReferences[sheetName] = new Set();
      
      console.log(`\n📊 시트 "${sheetName}" 분석 중...`);
      
      // 모든 셀 순회하여 수식 분석
      sheet.eachRow((row, rowNumber) => {
        row.eachCell((cell, colNumber) => {
          if (cell.formula) {
            totalFormulas++;
            sheetFormulaCount++;
            formulasBySheet[sheetName]++;
            
            const formula = cell.formula;
            const cellAddress = `${String.fromCharCode(64 + colNumber)}${rowNumber}`;
            
            // 수식 유형 분류
            let formulaType = '기타';
            if (formula.includes('VLOOKUP') || formula.includes('HLOOKUP')) {
              formulaType = 'LOOKUP';
            } else if (formula.includes('SUMIF') || formula.includes('COUNTIF') || formula.includes('AVERAGEIF')) {
              formulaType = 'IF계열';
            } else if (formula.includes('SUM') || formula.includes('COUNT') || formula.includes('AVERAGE')) {
              formulaType = '집계함수';
            } else if (formula.includes('IF(')) {
              formulaType = '조건문';
            } else if (formula.includes('INDEX') || formula.includes('MATCH')) {
              formulaType = 'INDEX/MATCH';
            } else if (formula.includes('CONCATENATE') || formula.includes('&')) {
              formulaType = '문자열';
            } else if (formula.includes('DATE') || formula.includes('TODAY') || formula.includes('NOW')) {
              formulaType = '날짜함수';
            }
            
            formulasByType[formulaType] = (formulasByType[formulaType] || 0) + 1;
            
            // 시트간 참조 찾기
            const sheetRefMatches = formula.match(/[가-힣a-zA-Z0-9\s]+!/g);
            if (sheetRefMatches) {
              sheetRefMatches.forEach(ref => {
                const refSheetName = ref.replace('!', '');
                sheetReferences[sheetName].add(refSheetName);
              });
            }
            
            // 복잡한 수식 (길이 50자 이상 또는 중첩함수)
            if (formula.length > 50 || (formula.match(/\(/g) || []).length > 3) {
              complexFormulas.push({
                sheet: sheetName,
                cell: cellAddress,
                formula: formula.substring(0, 100) + (formula.length > 100 ? '...' : ''),
                length: formula.length,
                nestingLevel: (formula.match(/\(/g) || []).length
              });
            }
          }
        });
      });
      
      console.log(`    ✅ 완료: ${sheetFormulaCount}개 수식 발견`);
    });
    
    console.log('\n🎯 === 분석 결과 종합 ===');
    console.log(`📊 총 수식 개수: ${totalFormulas}개`);
    console.log('');
    
    console.log('📋 시트별 수식 분포:');
    Object.entries(formulasBySheet)
      .sort(([,a], [,b]) => b - a)
      .forEach(([sheet, count]) => {
        if (count > 0) {
          console.log(`  ${sheet}: ${count}개`);
        }
      });
    console.log('');
    
    console.log('🔧 수식 유형별 분포:');
    Object.entries(formulasByType)
      .sort(([,a], [,b]) => b - a)
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count}개`);
      });
    console.log('');
    
    console.log('🔗 시트간 참조 관계:');
    Object.entries(sheetReferences).forEach(([sheet, refs]) => {
      if (refs.size > 0) {
        console.log(`  "${sheet}" → [${Array.from(refs).join(', ')}]`);
      }
    });
    console.log('');
    
    console.log('⚡ 복잡한 수식 TOP 10:');
    complexFormulas
      .sort((a, b) => b.length - a.length)
      .slice(0, 10)
      .forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.sheet}!${item.cell} (${item.length}자, 중첩${item.nestingLevel})`);
        console.log(`     ${item.formula}`);
        console.log('');
      });
      
    console.log('🏁 분석 완료:', new Date().toLocaleString('ko-KR'));
    
  } catch (error) {
    console.error('❌ 분석 오류:', error.message);
    console.error(error.stack);
  }
}

analyzeExcelFormulas();
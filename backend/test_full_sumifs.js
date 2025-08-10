#!/usr/bin/env node

/**
 * 전체 SUMIFS 수식 계산 테스트 (456개 수식)
 * 실제 Excel 파일의 모든 SUMIFS 수식을 처리하고 정확도 검증
 */

const CalculationEngine = require('./src/engines/CalculationEngine');
const XLSX = require('xlsx');
const path = require('path');

async function extractSUMIFSFormulas(filePath) {
  try {
    console.log(`Excel 파일에서 SUMIFS 수식 추출 중: ${filePath}`);
    
    const workbook = XLSX.readFile(filePath, { cellFormula: true });
    const formulas = [];
    let totalFormulas = 0;

    // 모든 시트 검사
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      
      // 시트의 모든 셀 검사
      Object.keys(worksheet).forEach(cellAddress => {
        if (cellAddress.startsWith('!')) return; // 메타데이터 스킵
        
        const cell = worksheet[cellAddress];
        if (cell.f && cell.f.includes('SUMIFS')) {
          formulas.push({
            sheet: sheetName,
            cell: cellAddress,
            formula: cell.f,
            value: cell.v // Excel의 계산된 값
          });
          totalFormulas++;
        }
      });
    });

    console.log(`✅ SUMIFS 수식 추출 완료: ${totalFormulas}개`);
    return formulas;
    
  } catch (error) {
    console.error('Excel 파일 읽기 오류:', error);
    throw error;
  }
}

async function loadExcelData(filePath) {
  try {
    console.log('Excel 데이터 로드 중...');
    
    const workbook = XLSX.readFile(filePath, { cellFormula: true });
    const sheets = {};

    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, 
        raw: false,
        defval: null 
      });
      sheets[sheetName] = data;
    });

    console.log(`✅ ${Object.keys(sheets).length}개 시트 데이터 로드 완료`);
    return sheets;
    
  } catch (error) {
    console.error('Excel 데이터 로드 오류:', error);
    throw error;
  }
}

async function testFullSUMIFS() {
  console.log('=== 전체 SUMIFS 계산 테스트 (456개 수식) ===\n');

  const excelPath = path.join(__dirname, '..', 'decrypted_sample.xlsx');
  console.log(`Excel 파일 경로: ${excelPath}`);

  try {
    // 1. Excel에서 SUMIFS 수식 추출
    const formulas = await extractSUMIFSFormulas(excelPath);
    console.log(`추출된 SUMIFS 수식: ${formulas.length}개\n`);

    // 처음 10개 수식 미리보기
    console.log('=== SUMIFS 수식 샘플 (처음 10개) ===');
    formulas.slice(0, 10).forEach((formula, index) => {
      console.log(`${index + 1}. [${formula.sheet}!${formula.cell}] ${formula.formula}`);
      console.log(`   Excel 결과: ${formula.value}`);
    });

    // 2. Excel 데이터 로드
    const excelSheets = await loadExcelData(excelPath);

    // 3. 계산 엔진 초기화
    const engine = new CalculationEngine();

    // 4. Excel 데이터를 계산 엔진에 로드
    console.log('\n=== Excel 데이터 계산 엔진 로드 ===');
    Object.keys(excelSheets).forEach(sheetName => {
      engine.sheetData.set(sheetName, excelSheets[sheetName]);
      console.log(`${sheetName}: ${excelSheets[sheetName].length}행 로드됨`);
    });

    // 5. 계정과목 매핑 생성
    await engine.createAccountMappings();

    // 6. 모든 SUMIFS 수식 계산
    console.log('\n=== 전체 SUMIFS 수식 계산 시작 ===');
    
    const startTime = Date.now();
    const results = {
      totalFormulas: formulas.length,
      successCount: 0,
      errorCount: 0,
      exactMatches: 0,
      errors: [],
      comparisons: []
    };

    for (let i = 0; i < formulas.length; i++) {
      const formula = formulas[i];
      
      try {
        const jsResult = await engine.executeSUMIFS_Enhanced(formula);
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
        if (i % 50 === 0 || i === formulas.length - 1) {
          console.log(`진행률: ${i + 1}/${formulas.length} (${(((i + 1) / formulas.length) * 100).toFixed(1)}%)`);
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

    // 7. 결과 출력
    console.log('\n=== 최종 결과 ===');
    console.log(`총 수식: ${results.totalFormulas}개`);
    console.log(`성공: ${results.successCount}개`);
    console.log(`실패: ${results.errorCount}개`);
    console.log(`정확한 매칭: ${results.exactMatches}개`);
    console.log(`정확도: ${accuracy}%`);
    console.log(`처리 시간: ${processingTime}ms (${(processingTime / 1000).toFixed(2)}초)`);

    // 8. 불일치 결과 분석 (처음 10개)
    const mismatches = results.comparisons.filter(c => !c.match);
    if (mismatches.length > 0) {
      console.log(`\n=== 불일치 결과 분석 (처음 10개) ===`);
      mismatches.slice(0, 10).forEach((mismatch, index) => {
        console.log(`${index + 1}. [${mismatch.sheet}!${mismatch.cell}]`);
        console.log(`   JavaScript: ${mismatch.jsResult}`);
        console.log(`   Excel: ${mismatch.excelResult}`);
        console.log(`   차이: ${Math.abs(mismatch.jsResult - mismatch.excelResult)}`);
      });
    }

    // 9. 오류 분석
    if (results.errors.length > 0) {
      console.log(`\n=== 오류 분석 (처음 10개) ===`);
      results.errors.slice(0, 10).forEach((error, index) => {
        console.log(`${index + 1}. [${error.sheet}!${error.cell}] ${error.error}`);
      });
    }

    // 10. 성공률 확인
    console.log('\n=== 테스트 결과 평가 ===');
    if (accuracy >= 95) {
      console.log('🎉 테스트 성공: 95% 이상 정확도 달성!');
    } else if (accuracy >= 90) {
      console.log('✅ 테스트 양호: 90% 이상 정확도 달성');
    } else {
      console.log('⚠️  테스트 개선 필요: 정확도가 90% 미만');
    }

  } catch (error) {
    console.error('테스트 실행 중 오류 발생:', error);
  }

  console.log('\n=== 전체 SUMIFS 계산 테스트 완료 ===');
}

// 스크립트 직접 실행 시
if (require.main === module) {
  testFullSUMIFS().catch(console.error);
}

module.exports = { testFullSUMIFS };
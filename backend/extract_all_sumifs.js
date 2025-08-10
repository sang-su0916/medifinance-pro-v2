#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

async function extractAllSUMIFS() {
  console.log('=== 전체 SUMIFS 수식 추출 ===\n');

  try {
    const excelPath = path.join(__dirname, '..', 'decrypted_sample.xlsx');
    const workbook = XLSX.readFile(excelPath, { cellFormula: true });

    const formulas = [];

    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      
      Object.keys(worksheet).forEach(cellAddress => {
        if (cellAddress.startsWith('!')) return;
        
        const cell = worksheet[cellAddress];
        if (cell.f && cell.f.includes('SUMIFS')) {
          formulas.push({
            sheet: sheetName,
            cell: cellAddress,
            formula: cell.f,
            value: cell.v || 0
          });
        }
      });
    });

    console.log(`✅ SUMIFS 수식 추출 완료: ${formulas.length}개`);
    
    // 처음 10개 예시 출력
    console.log('\n처음 10개 수식:');
    formulas.slice(0, 10).forEach((formula, index) => {
      console.log(`${index + 1}. [${formula.sheet}!${formula.cell}] ${formula.formula} = ${formula.value}`);
    });

    // 시트별 분포
    console.log('\n시트별 분포:');
    const sheetCounts = {};
    formulas.forEach(f => {
      sheetCounts[f.sheet] = (sheetCounts[f.sheet] || 0) + 1;
    });
    
    Object.entries(sheetCounts).forEach(([sheet, count]) => {
      console.log(`  ${sheet}: ${count}개`);
    });

    return formulas;

  } catch (error) {
    console.error('수식 추출 중 오류:', error);
    throw error;
  }
}

if (require.main === module) {
  extractAllSUMIFS().catch(console.error);
}

module.exports = { extractAllSUMIFS };
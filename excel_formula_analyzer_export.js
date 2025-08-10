const ExcelJS = require('exceljs');
const fs = require('fs');

async function exportAnalysis() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('decrypted_sample.xlsx');

  let totalFormulas = 0;
  const formulasByType = {};
  const formulasBySheet = {};
  const sheetReferences = {};
  const complexFormulas = [];

  workbook.worksheets.forEach(sheet => {
    const sheetName = sheet.name;
    formulasBySheet[sheetName] = 0;
    sheetReferences[sheetName] = new Set();

    sheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        if (cell.formula) {
          totalFormulas++;
          formulasBySheet[sheetName]++;

          const formula = cell.formula;

          let formulaType = '기타';
          if (formula.includes('VLOOKUP') || formula.includes('HLOOKUP')) formulaType = 'LOOKUP';
          else if (formula.includes('SUMIF') || formula.includes('COUNTIF') || formula.includes('AVERAGEIF')) formulaType = 'IF계열';
          else if (formula.includes('SUM(') || formula.includes('COUNT(') || formula.includes('AVERAGE(')) formulaType = '집계함수';
          else if (formula.includes('IF(')) formulaType = '조건문';
          else if (formula.includes('INDEX') || formula.includes('MATCH')) formulaType = 'INDEX/MATCH';
          else if (formula.includes('CONCATENATE') || formula.includes('&')) formulaType = '문자열';
          else if (formula.includes('DATE') || formula.includes('TODAY') || formula.includes('NOW')) formulaType = '날짜함수';

          formulasByType[formulaType] = (formulasByType[formulaType] || 0) + 1;

          const sheetRefMatches = formula.match(/[가-힣a-zA-Z0-9\s]+!/g);
          if (sheetRefMatches) {
            sheetRefMatches.forEach(ref => {
              const refSheetName = ref.replace('!', '');
              sheetReferences[sheetName].add(refSheetName);
            });
          }

          if (formula.length > 50 || (formula.match(/\(/g) || []).length > 3) {
            const cellAddress = `${String.fromCharCode(64 + colNumber)}${rowNumber}`;
            complexFormulas.push({ sheet: sheetName, cell: cellAddress, formula });
          }
        }
      });
    });
  });

  const refs = Object.fromEntries(
    Object.entries(sheetReferences).map(([k, v]) => [k, Array.from(v)])
  );

  const output = {
    generatedAt: new Date().toISOString(),
    totals: { totalFormulas },
    formulasBySheet,
    formulasByType,
    sheetReferences: refs,
    complexFormulasTop10: complexFormulas
      .sort((a, b) => b.formula.length - a.formula.length)
      .slice(0, 10)
  };

  fs.writeFileSync('analysis/formula_summary.json', JSON.stringify(output, null, 2));
  console.log('✅ 분석 결과 저장: analysis/formula_summary.json');
}

exportAnalysis().catch(e => {
  console.error('Export error', e);
});
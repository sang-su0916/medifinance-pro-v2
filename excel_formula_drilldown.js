const ExcelJS = require('exceljs');
const fs = require('fs');

function normalizeFormula(formula) {
  if (!formula) return '';
  // Replace absolute/relative cell refs like $A$1, B2, AA10
  return formula
    .replace(/\$?[A-Z]{1,3}\$?\d+/g, (m) => m.replace(/\d+/g, 'n'))
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim();
}

function extractFunctions(formula) {
  if (!formula) return [];
  const funcs = [];
  const regex = /([A-Z가-힣]{2,})\s*\(/g;
  let match;
  while ((match = regex.exec(formula)) !== null) {
    const name = match[1];
    // Filter out sheet names accidentally captured (heuristic)
    if (!/^[가-힣A-Z]{2,}$/.test(name)) continue;
    funcs.push(name);
  }
  return funcs;
}

async function analyzePrioritySheets() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('decrypted_sample.xlsx');

  const targetSheets = ['출', '분', '월별요약손익계산서(추정)'];
  const output = { generatedAt: new Date().toISOString(), sheets: {} };

  for (const name of targetSheets) {
    const sheet = workbook.getWorksheet(name);
    if (!sheet) continue;

    const sheetInfo = {
      size: { rows: sheet.actualRowCount, cols: sheet.actualColumnCount },
      headers: [],
      columns: {},
      externalRefs: new Set(),
      functions: {},
    };

    // headers
    const headerRow = sheet.getRow(1);
    for (let c = 1; c <= sheet.actualColumnCount; c++) {
      const v = headerRow.getCell(c).value;
      sheetInfo.headers.push(v ? String(v) : '');
    }

    // scan first N rows to limit runtime
    const maxRows = Math.min(sheet.actualRowCount, 2000);

    for (let r = 1; r <= maxRows; r++) {
      const row = sheet.getRow(r);
      for (let c = 1; c <= sheet.actualColumnCount; c++) {
        const cell = row.getCell(c);
        if (!cell || !cell.formula) continue;

        const colLetter = sheet.getColumn(c).letter || String.fromCharCode(64 + c);
        if (!sheetInfo.columns[colLetter]) {
          sheetInfo.columns[colLetter] = {
            index: c,
            header: sheetInfo.headers[c - 1] || '',
            formulaSamples: [],
            normalizedPatterns: {},
            referencedSheets: {},
            functionUsage: {},
          };
        }

        const f = cell.formula;
        const normalized = normalizeFormula(f);
        const col = sheetInfo.columns[colLetter];

        if (col.formulaSamples.length < 5) {
          col.formulaSamples.push({ row: r, formula: f });
        }
        col.normalizedPatterns[normalized] = (col.normalizedPatterns[normalized] || 0) + 1;

        // referenced sheets
        const refs = f.match(/[가-힣a-zA-Z0-9_\s]+!/g);
        if (refs) {
          refs.forEach(ref => {
            const refSheet = ref.replace('!', '').trim();
            col.referencedSheets[refSheet] = (col.referencedSheets[refSheet] || 0) + 1;
            sheetInfo.externalRefs.add(refSheet);
          });
        }

        // function usage
        const funcs = extractFunctions(f);
        funcs.forEach(fn => {
          col.functionUsage[fn] = (col.functionUsage[fn] || 0) + 1;
          sheetInfo.functions[fn] = (sheetInfo.functions[fn] || 0) + 1;
        });
      }
    }

    // convert sets
    sheetInfo.externalRefs = Array.from(sheetInfo.externalRefs);

    // sort patterns and functions
    for (const colLetter of Object.keys(sheetInfo.columns)) {
      const col = sheetInfo.columns[colLetter];
      col.normalizedPatterns = Object.entries(col.normalizedPatterns)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([pattern, count]) => ({ pattern, count }));
      col.referencedSheets = Object.entries(col.referencedSheets)
        .sort((a, b) => b[1] - a[1])
        .map(([s, count]) => ({ sheet: s, count }));
      col.functionUsage = Object.entries(col.functionUsage)
        .sort((a, b) => b[1] - a[1])
        .map(([fn, count]) => ({ fn, count }));
    }

    sheetInfo.functions = Object.entries(sheetInfo.functions)
      .sort((a, b) => b[1] - a[1])
      .map(([fn, count]) => ({ fn, count }));

    output.sheets[name] = sheetInfo;
  }

  // Save JSON
  fs.writeFileSync('analysis/priority_sheets_drilldown.json', JSON.stringify(output, null, 2));

  // Save concise markdown summary
  const md = [];
  md.push('# 우선순위 시트 수식 패턴 요약');
  for (const [name, info] of Object.entries(output.sheets)) {
    md.push(`\n## ${name}`);
    md.push(`- 크기: ${info.size.rows}행 x ${info.size.cols}열`);
    md.push(`- 외부 참조: ${info.externalRefs.join(', ') || '없음'}`);
    md.push(`- 상위 함수: ${(info.functions.slice(0,5).map(x=>`${x.fn}(${x.count})`).join(', ')) || '없음'}`);
    
    md.push('\n### 컬럼별 패턴 Top');
    for (const [colLetter, col] of Object.entries(info.columns)) {
      const topPattern = col.normalizedPatterns[0];
      if (!topPattern) continue;
      md.push(`- ${colLetter}열 (${col.header || ''})`);
      md.push(`  - 대표 패턴: \`${topPattern.pattern}\` (${topPattern.count})`);
      if (col.referencedSheets.length > 0) {
        md.push(`  - 참조 시트: ${col.referencedSheets.slice(0,3).map(x=>`${x.sheet}(${x.count})`).join(', ')}`);
      }
    }
  }
  fs.writeFileSync('analysis/priority_sheets_summary.md', md.join('\n'));

  console.log('✅ 드릴다운 결과 저장:');
  console.log(' - analysis/priority_sheets_drilldown.json');
  console.log(' - analysis/priority_sheets_summary.md');
}

analyzePrioritySheets().catch(err => {
  console.error('Drilldown error', err);
  process.exit(1);
});

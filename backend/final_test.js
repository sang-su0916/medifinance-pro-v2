const EnhancedEngine = require('./src/engines/EnhancedCalculationEngine.js');
const path = require('path');

async function finalTest() {
  try {
    console.log('=== 최종 SUMIFS 계산 테스트 ===');
    const engine = new EnhancedEngine();
    
    const excelPath = path.join(__dirname, '..', 'decrypted_sample.xlsx');
    await engine.loadExcelFile(excelPath);
    
    // C5 수식 테스트: 1월 기타수입
    const testFormula = {
      sheet: '월별요약손익계산서(추정)',
      cell: 'C5',
      formula: 'SUMIFS(매출내역total!$G:$G,매출내역total!$A:$A,C$2,매출내역total!$J:$J,$B5)',
      value: 52223360
    };
    
    console.log('\\n테스트 수식:', testFormula.formula);
    console.log('Excel 예상값:', testFormula.value);
    
    const result = engine.executeSUMIFS(testFormula);
    console.log('JavaScript 결과:', result);
    
    const match = result === testFormula.value;
    console.log('매칭 결과:', match ? '✅ 성공' : '❌ 실패');
    
    if (!match) {
      console.log('차이:', Math.abs(result - testFormula.value));
    }

    return { success: match, result, expected: testFormula.value };
    
  } catch (error) {
    console.error('오류 발생:', error.message);
    console.error('스택 트레이스:', error.stack);
    return { success: false, error: error.message };
  }
}

finalTest().then(result => {
  console.log('\\n=== 테스트 완료 ===');
  console.log('결과:', JSON.stringify(result, null, 2));
  process.exit(0);
}).catch(error => {
  console.error('예상치 못한 오류:', error);
  process.exit(1);
});
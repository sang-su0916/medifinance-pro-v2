#!/usr/bin/env node

/**
 * 분류 엔진 디버깅 스크립트
 * 실제 병원 데이터로 분류 엔진이 제대로 동작하는지 확인
 */

const ClassificationEngine = require('../src/engines/ClassificationEngine');
const ValidationSystem = require('./ValidationSystem');

async function debugClassification() {
  console.log('🔍 분류 엔진 디버깅 시작');
  console.log('=' .repeat(50));
  
  try {
    // 1. 데이터 로드
    console.log('📊 테스트 데이터 로드...');
    const validationSystem = new ValidationSystem();
    const testData = await validationSystem.loadTestData();
    const transactions = validationSystem.convertRawDataToTransactions(testData.rawSample);
    
    console.log(`✅ ${transactions.length}건의 거래내역 로드 완료`);
    
    // 2. 첫 번째 거래내역 샘플 분석
    if (transactions.length > 0) {
      const sampleTransaction = transactions[0];
      console.log('\n🔬 첫 번째 거래내역 분석:');
      console.log('원본 데이터:', JSON.stringify(sampleTransaction, null, 2));
      
      // 3. 분류 엔진 초기화
      console.log('\n⚙️ 분류 엔진 초기화...');
      const classificationEngine = new ClassificationEngine();
      console.log('✅ 분류 엔진 초기화 완료');
      
      // 4. 단일 거래 분류 테스트
      console.log('\n🏥 단일 거래 분류 테스트...');
      try {
        const singleResult = await classificationEngine.classifyTransaction(sampleTransaction, 0);
        console.log('✅ 단일 분류 성공:');
        console.log(`   계정과목: ${singleResult.account}`);
        console.log(`   신뢰도: ${singleResult.confidence.toFixed(3)}`);
        console.log(`   거래유형: ${singleResult.transactionType}`);
        console.log(`   적용 규칙: ${singleResult.appliedRules.join(', ')}`);
        console.log('   메타데이터:', JSON.stringify(singleResult.metadata, null, 2));
      } catch (error) {
        console.log('❌ 단일 분류 실패:', error.message);
        console.log('스택 트레이스:', error.stack);
      }
      
      // 5. 소량 배치 분류 테스트 (처음 5건)
      console.log('\n📦 소량 배치 분류 테스트 (5건)...');
      const smallBatch = transactions.slice(0, 5);
      try {
        const batchResult = await classificationEngine.classifyTransactions(smallBatch);
        console.log('✅ 배치 분류 결과:');
        console.log(`   성공: ${batchResult.classified.length}건`);
        console.log(`   불확실: ${batchResult.uncertain.length}건`);
        console.log(`   실패: ${batchResult.failed.length}건`);
        console.log(`   처리 시간: ${batchResult.processingTime}ms`);
        
        // 성공 케이스 상세
        if (batchResult.classified.length > 0) {
          console.log('\n✅ 성공한 분류 케이스:');
          batchResult.classified.forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.metadata.patientType || 'Unknown'} → ${item.account} (신뢰도: ${item.confidence.toFixed(3)})`);
          });
        }
        
        // 실패 케이스 상세
        if (batchResult.failed.length > 0) {
          console.log('\n❌ 실패한 분류 케이스:');
          batchResult.failed.forEach((item, index) => {
            console.log(`   ${index + 1}. 인덱스 ${item.index}: ${item.reason}`);
            console.log(`      원본 데이터: ${JSON.stringify(item.row, null, 2).substring(0, 200)}...`);
          });
        }
        
        // 불확실 케이스 상세
        if (batchResult.uncertain.length > 0) {
          console.log('\n⚠️ 불확실한 분류 케이스:');
          batchResult.uncertain.forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.account} (신뢰도: ${item.confidence.toFixed(3)})`);
          });
        }
        
      } catch (error) {
        console.log('❌ 배치 분류 실패:', error.message);
        console.log('스택 트레이스:', error.stack);
      }
      
      // 6. 분류 규칙 분석
      console.log('\n📋 분류 규칙 분석...');
      const rules = classificationEngine.classificationRules;
      
      console.log('수익 규칙:');
      console.log(`   환자유형별: ${Object.keys(rules.revenue.patientType).length}개`);
      console.log(`   진료과별: ${Object.keys(rules.revenue.department).length}개`);
      console.log(`   키워드: ${Object.keys(rules.revenue.keywords).length}개`);
      
      console.log('비용 규칙:');
      console.log(`   비용유형별: ${Object.keys(rules.expense.expenseType).length}개`);
      console.log(`   공급업체별: ${Object.keys(rules.expense.vendor).length}개`);
      console.log(`   키워드: ${Object.keys(rules.expense.keywords).length}개`);
      
      // 7. 실제 데이터와 규칙 매칭 분석
      console.log('\n🎯 데이터-규칙 매칭 분석...');
      console.log('첫 번째 거래의 필드:');
      Object.keys(sampleTransaction).forEach(key => {
        const value = sampleTransaction[key];
        console.log(`   ${key}: ${value} (타입: ${typeof value})`);
      });
      
      // 금액 추출 테스트
      const amount = classificationEngine.extractAmount(sampleTransaction);
      console.log(`추출된 금액: ${amount}`);
      
      // 환자 유형 추출 테스트
      const patientType = classificationEngine.extractPatientType(sampleTransaction);
      console.log(`추출된 환자 유형: ${patientType}`);
      
      // 거래 유형 판단 테스트
      try {
        const transactionType = classificationEngine.determineTransactionType(sampleTransaction);
        console.log(`판단된 거래 유형: ${transactionType}`);
      } catch (error) {
        console.log(`거래 유형 판단 실패: ${error.message}`);
      }
    }
    
    console.log('\n✨ 분류 엔진 디버깅 완료');
    
  } catch (error) {
    console.error('💥 디버깅 실패:', error.message);
    console.error('스택 트레이스:', error.stack);
  }
}

// 스크립트 실행
debugClassification().catch(error => {
  console.error('💥 디버깅 실행 실패:', error);
  process.exit(1);
});
#!/usr/bin/env node

/**
 * JavaScript 엔진 100% 정확도 검증 실행 스크립트
 * 
 * 사용법:
 * node run-validation.js [옵션]
 * 
 * 옵션:
 * --classification-only : 계정분류만 검증
 * --calculation-only    : 계산만 검증
 * --workflow-only       : 워크플로우만 검증
 * --performance-only    : 성능만 검증
 * --verbose             : 상세 로그 출력
 * --output-path <path>  : 결과 저장 경로 지정
 */

const ValidationSystem = require('./ValidationSystem');
const fs = require('fs');
const path = require('path');

class ValidationRunner {
  constructor() {
    this.options = this.parseCommandLineArgs();
    this.validationSystem = new ValidationSystem();
  }

  /**
   * 메인 실행 함수
   */
  async run() {
    console.log('🚀 JavaScript 엔진 100% 정확도 검증 시작');
    console.log('=' .repeat(60));
    
    const startTime = Date.now();
    
    try {
      // 검증 옵션에 따른 실행
      let results;
      
      if (this.options.classificationOnly) {
        results = await this.runClassificationValidation();
      } else if (this.options.calculationOnly) {
        results = await this.runCalculationValidation();
      } else if (this.options.workflowOnly) {
        results = await this.runWorkflowValidation();
      } else if (this.options.performanceOnly) {
        results = await this.runPerformanceValidation();
      } else {
        // 전체 검증 실행
        results = await this.validationSystem.executeFullValidation(this.options);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // 결과 출력
      this.displayResults(results, totalTime);

      // 결과 저장
      if (this.options.outputPath) {
        await this.saveResults(results, this.options.outputPath);
      }

      // 종료 코드 결정
      const exitCode = this.determineExitCode(results);
      console.log(`\n🏁 검증 완료 (종료 코드: ${exitCode})`);
      process.exit(exitCode);

    } catch (error) {
      console.error('💥 검증 실행 중 오류 발생:', error.message);
      if (this.options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  /**
   * 분류 검증만 실행
   */
  async runClassificationValidation() {
    console.log('🏥 계정과목 분류 정확도 검증만 실행...');
    
    const testData = await this.validationSystem.loadTestData();
    const classificationResult = await this.validationSystem.validateClassificationAccuracy(testData);
    
    return {
      classification: classificationResult,
      partial: true,
      type: 'classification'
    };
  }

  /**
   * 계산 검증만 실행
   */
  async runCalculationValidation() {
    console.log('🧮 SUMIFS 계산 정확도 검증만 실행...');
    
    const testData = await this.validationSystem.loadTestData();
    const calculationResult = await this.validationSystem.validateCalculationAccuracy(testData);
    
    return {
      calculation: calculationResult,
      partial: true,
      type: 'calculation'
    };
  }

  /**
   * 워크플로우 검증만 실행
   */
  async runWorkflowValidation() {
    console.log('🔄 전체 워크플로우 검증만 실행...');
    
    const testData = await this.validationSystem.loadTestData();
    const workflowResult = await this.validationSystem.validateWorkflowAccuracy(testData);
    
    return {
      workflow: workflowResult,
      partial: true,
      type: 'workflow'
    };
  }

  /**
   * 성능 검증만 실행
   */
  async runPerformanceValidation() {
    console.log('⚡ 성능 검증만 실행...');
    
    const testData = await this.validationSystem.loadTestData();
    const performanceResult = await this.validationSystem.validatePerformance(testData);
    
    return {
      performance: performanceResult,
      partial: true,
      type: 'performance'
    };
  }

  /**
   * 결과 화면 출력
   */
  displayResults(results, totalTime) {
    console.log('\n📊 검증 결과');
    console.log('=' .repeat(60));

    if (results.partial) {
      this.displayPartialResults(results);
    } else {
      this.displayFullResults(results);
    }

    console.log(`\n⏱️  총 검증 시간: ${this.formatTime(totalTime)}`);
    
    if (results.success === false) {
      console.log(`❌ 검증 실패: ${results.error}`);
      return;
    }
    
    // 메모리 사용량 표시
    if (results.overall && results.overall.memoryUsage) {
      const memoryDiff = results.overall.memoryUsage.end.heapUsed - results.overall.memoryUsage.start.heapUsed;
      console.log(`💾 메모리 사용량: ${this.formatBytes(memoryDiff)}`);
    }
  }

  /**
   * 부분 결과 출력
   */
  displayPartialResults(results) {
    const result = results[results.type];
    
    switch (results.type) {
      case 'classification':
        console.log(`🏥 계정과목 분류 정확도: ${result.accuracy.overall.toFixed(2)}%`);
        console.log(`   - 처리 건수: ${result.totalTransactions}건`);
        console.log(`   - 분류 성공: ${result.jsResults.classified}건`);
        console.log(`   - 불확실: ${result.jsResults.uncertain}건`);
        console.log(`   - 실패: ${result.jsResults.failed}건`);
        console.log(`   - 통과 여부: ${result.passesThreshold ? '✅ 통과' : '❌ 미달'}`);
        
        if (result.accuracy.averageConfidence) {
          console.log(`   - 평균 신뢰도: ${result.accuracy.averageConfidence.toFixed(3)}`);
          console.log(`   - 고신뢰도 비율: ${result.accuracy.highConfidenceRate?.toFixed(1) || 0}%`);
        }
        
        if (this.options.verbose) {
          // 일관성 검증 결과
          if (result.accuracy.consistency) {
            const consistency = result.accuracy.consistency;
            console.log(`   - 데이터 무결성: ${consistency.dataIntegrity ? '✅' : '❌'}`);
            console.log(`   - 규칙 일관성: ${consistency.ruleConsistency ? '✅' : '❌'}`);
            console.log(`   - 신뢰도 일관성: ${consistency.confidenceConsistency ? '✅' : '❌'}`);
            
            if (consistency.issues && consistency.issues.length > 0) {
              console.log(`   - 일관성 이슈 (상위 3개):`);
              consistency.issues.slice(0, 3).forEach((issue, index) => {
                console.log(`     ${index + 1}. ${issue}`);
              });
            }
          }
          
          // 계정별 분포
          if (result.quality && result.quality.accountDistribution) {
            const accounts = Object.entries(result.quality.accountDistribution);
            if (accounts.length > 0) {
              console.log(`   - 계정별 분포:`);
              accounts.slice(0, 5).forEach(([account, count]) => {
                console.log(`     ${account}: ${count}건`);
              });
            }
          }
          
          // 권장사항
          if (result.recommendations && result.recommendations.length > 0) {
            console.log(`   - 권장사항:`);
            result.recommendations.slice(0, 3).forEach((rec, index) => {
              console.log(`     ${index + 1}. ${rec.message} (${rec.priority})`);
            });
          }
        }
        break;

      case 'calculation':
        console.log(`🧮 SUMIFS 계산 정확도: ${result.accuracy.overall.toFixed(3)}%`);
        console.log(`   - 처리 수식: ${result.totalFormulas}개`);
        console.log(`   - 실행 성공: ${result.jsResults.executed}개`);
        console.log(`   - 오류: ${result.jsResults.errors}개`);
        console.log(`   - 통과 여부: ${result.passesThreshold ? '✅ 통과' : '❌ 미달'}`);
        
        if (this.options.verbose && result.differences.length > 0) {
          console.log(`   - 주요 차이 케이스 (상위 5개):`);
          result.differences.slice(0, 5).forEach((diff, index) => {
            console.log(`     ${index + 1}. ${diff.formulaId}: JS=${diff.jsValue}, Excel=${diff.excelValue} (차이: ${diff.difference.toFixed(2)})`);
          });
        }
        break;

      case 'workflow':
        console.log(`🔄 워크플로우 정확도: ${result.accuracy.overall.toFixed(2)}%`);
        console.log(`   - 완료 단계: ${result.workflow.stepsCompleted}/${result.workflow.totalSteps}`);
        console.log(`   - 처리 시간: ${this.formatTime(result.workflow.processingTime)}`);
        console.log(`   - 오류: ${result.workflow.errors}개`);
        console.log(`   - 통과 여부: ${result.passesThreshold ? '✅ 통과' : '❌ 미달'}`);
        break;

      case 'performance':
        console.log(`⚡ 성능 검증 결과:`);
        console.log(`   - 메모리 효율성: ${result.overall.memoryEfficient ? '✅ 통과' : '❌ 미달'}`);
        console.log(`   - 처리 속도: ${result.overall.timeEfficient ? '✅ 통과' : '❌ 미달'}`);
        console.log(`   - 확장성: ${result.overall.scalable ? '✅ 통과' : '❌ 미달'}`);
        console.log(`   - 동시성: ${result.overall.concurrent ? '✅ 통과' : '❌ 미달'}`);
        
        if (this.options.verbose) {
          console.log(`   - 평균 메모리 사용량: ${this.formatBytes(result.metrics.avgMemoryUsage)}`);
          console.log(`   - 평균 처리 시간: ${this.formatTime(result.metrics.avgProcessingTime)}`);
        }
        break;
    }
  }

  /**
   * 전체 결과 출력
   */
  displayFullResults(results) {
    if (!results.overall) {
      console.log('❌ 전체 결과를 가져올 수 없습니다.');
      return;
    }

    const overall = results.overall;
    
    console.log(`🎯 최종 점수: ${overall.finalScore?.toFixed(2) || 0}%`);
    console.log(`🏆 전체 통과: ${overall.passed ? '✅ 통과' : '❌ 미달'}`);
    console.log();

    // 카테고리별 결과
    const categories = overall.categories || {};
    
    if (categories.classification) {
      console.log(`🏥 계정분류: ${categories.classification.score.toFixed(2)}% ${categories.classification.passed ? '✅' : '❌'}`);
    }
    
    if (categories.calculation) {
      console.log(`🧮 SUMIFS 계산: ${categories.calculation.score.toFixed(3)}% ${categories.calculation.passed ? '✅' : '❌'}`);
    }
    
    if (categories.workflow) {
      console.log(`🔄 워크플로우: ${categories.workflow.score.toFixed(2)}% ${categories.workflow.passed ? '✅' : '❌'}`);
    }
    
    if (categories.performance) {
      const perfPassed = categories.performance.passed;
      console.log(`⚡ 성능: ${perfPassed ? '✅ 통과' : '❌ 미달'}`);
    }

    // 상세 정보 (verbose 모드)
    if (this.options.verbose) {
      console.log('\n📋 상세 결과:');
      
      if (results.classification) {
        console.log(`   계정분류 - 처리: ${results.classification.totalTransactions}건, 성공률: ${((results.classification.jsResults.classified / results.classification.totalTransactions) * 100).toFixed(1)}%`);
      }
      
      if (results.calculation) {
        console.log(`   SUMIFS - 수식: ${results.calculation.totalFormulas}개, 오류율: ${results.calculation.accuracy.errorRate.toFixed(2)}%`);
      }
      
      if (results.workflow) {
        console.log(`   워크플로우 - 단계: ${results.workflow.workflow.stepsCompleted}/${results.workflow.workflow.totalSteps}, 오류: ${results.workflow.workflow.errors}개`);
      }
    }
  }

  /**
   * 결과 저장
   */
  async saveResults(results, outputPath) {
    try {
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = path.basename(outputPath, path.extname(outputPath));
      const extension = path.extname(outputPath) || '.json';
      
      const fullPath = path.join(dir, `${filename}-${timestamp}${extension}`);
      
      fs.writeFileSync(fullPath, JSON.stringify(results, null, 2));
      console.log(`💾 결과 저장: ${fullPath}`);
      
    } catch (error) {
      console.warn(`⚠️ 결과 저장 실패: ${error.message}`);
    }
  }

  /**
   * 종료 코드 결정
   */
  determineExitCode(results) {
    if (results.success === false) {
      return 1; // 시스템 오류
    }
    
    if (results.partial) {
      const result = results[results.type];
      return result.passesThreshold ? 0 : 2; // 부분 검증 결과
    }
    
    if (results.overall && results.overall.passed) {
      return 0; // 성공
    }
    
    return 2; // 정확도 미달
  }

  /**
   * 명령줄 인자 파싱
   */
  parseCommandLineArgs() {
    const args = process.argv.slice(2);
    const options = {
      classificationOnly: false,
      calculationOnly: false,
      workflowOnly: false,
      performanceOnly: false,
      verbose: false,
      outputPath: null
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
        case '--classification-only':
          options.classificationOnly = true;
          break;
        case '--calculation-only':
          options.calculationOnly = true;
          break;
        case '--workflow-only':
          options.workflowOnly = true;
          break;
        case '--performance-only':
          options.performanceOnly = true;
          break;
        case '--verbose':
          options.verbose = true;
          break;
        case '--output-path':
          if (i + 1 < args.length) {
            options.outputPath = args[i + 1];
            i++; // 다음 인자 스킵
          }
          break;
        case '--help':
          this.showHelp();
          process.exit(0);
          break;
        default:
          if (arg.startsWith('--')) {
            console.warn(`⚠️ 알 수 없는 옵션: ${arg}`);
          }
      }
    }

    return options;
  }

  /**
   * 도움말 출력
   */
  showHelp() {
    console.log(`
JavaScript 엔진 100% 정확도 검증 도구

사용법:
  node run-validation.js [옵션]

옵션:
  --classification-only    계정과목 분류 정확도만 검증
  --calculation-only       SUMIFS 계산 정확도만 검증  
  --workflow-only          전체 워크플로우만 검증
  --performance-only       성능만 검증
  --verbose               상세 로그 출력
  --output-path <경로>     결과를 파일로 저장
  --help                  이 도움말 출력

예시:
  node run-validation.js --verbose
  node run-validation.js --classification-only --output-path ./reports/classification-test.json
  node run-validation.js --calculation-only --verbose
  
종료 코드:
  0: 성공 (모든 검증 통과)
  1: 시스템 오류
  2: 정확도 기준 미달
    `);
  }

  /**
   * 시간 포맷팅
   */
  formatTime(milliseconds) {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    } else if (milliseconds < 60000) {
      return `${(milliseconds / 1000).toFixed(1)}초`;
    } else {
      const minutes = Math.floor(milliseconds / 60000);
      const seconds = Math.floor((milliseconds % 60000) / 1000);
      return `${minutes}분 ${seconds}초`;
    }
  }

  /**
   * 바이트 포맷팅
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// 스크립트가 직접 실행된 경우에만 실행
if (require.main === module) {
  const runner = new ValidationRunner();
  runner.run().catch(error => {
    console.error('💥 실행 중 예상치 못한 오류:', error);
    process.exit(1);
  });
}

module.exports = ValidationRunner;
import React from 'react';
import { WorkflowResult, ValidationResult } from '../types';
import { FileText, Zap, AlertCircle, CheckCircle, Download, TrendingUp } from 'lucide-react';

interface ComparisonResultsProps {
  workflowResult: WorkflowResult;
  validationResult?: ValidationResult | null;
}

const ComparisonResults: React.FC<ComparisonResultsProps> = ({ 
  workflowResult, 
  validationResult 
}) => {
  // 비교 데이터 생성
  const comparisonData = [
    {
      category: '건보수익 분류',
      system: `${workflowResult.summary?.classifiedTransactions || 0}건`,
      excel: '수작업 필요',
      status: 'automated',
      improvement: '✅ 자동화 완료'
    },
    {
      category: 'SUMIFS 계산',
      system: `${(validationResult?.categories.calculation.accuracy || 0).toFixed(1)}%`,
      excel: '100%',
      status: (validationResult?.categories.calculation.accuracy ?? 0) >= 95 ? 'good' : 'warning',
      improvement: (validationResult?.categories.calculation.accuracy ?? 0) >= 95 ? '✅ 일치' : '⚠️ 개선 필요'
    },
    {
      category: '전체 워크플로우',
      system: `${(validationResult?.categories.workflow.accuracy || 0).toFixed(1)}%`,
      excel: '수동 프로세스',
      status: 'automated',
      improvement: '🚀 완전 자동화'
    }
  ];

  // 성능 메트릭
  const performanceMetrics = [
    {
      label: '처리 시간',
      system: `${(workflowResult.summary?.processingTime || 0) / 1000}초`,
      excel: '수십 분~수시간',
      improvement: '99% 시간 단축'
    },
    {
      label: '오류율',
      system: `${(100 - (validationResult?.score || 0)).toFixed(1)}%`,
      excel: '5-15% (수작업 오류)',
      improvement: (validationResult?.score ?? 0) >= 90 ? '오류율 감소' : '개선 진행중'
    },
    {
      label: '일관성',
      system: '100% 규칙 기반',
      excel: '개인차 존재',
      improvement: '완전 일관성 확보'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'automated': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'automated': return <Zap className="w-4 h-4" />;
      case 'good': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Excel vs JavaScript 비교</h2>
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          <span className="text-green-600 font-semibold">
            {validationResult ? `${validationResult.score.toFixed(1)}% 종합 점수` : '분석 중...'}
          </span>
        </div>
      </div>

      {/* 주요 비교 결과 */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 주요 기능 비교</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">기능</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">시스템 결과</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Excel 원본</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">개선사항</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {comparisonData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status)}
                      <span className="text-sm font-medium">{item.category}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-semibold text-blue-600">{item.system}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-gray-600">{item.excel}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-medium">{item.improvement}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 성능 메트릭 */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">⚡ 성능 개선 효과</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {performanceMetrics.map((metric, index) => (
            <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-3">{metric.label}</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">시스템:</span>
                  <span className="text-sm font-bold text-blue-600">{metric.system}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">기존:</span>
                  <span className="text-sm text-gray-500">{metric.excel}</span>
                </div>
                <div className="pt-2 border-t border-blue-200">
                  <span className="text-sm font-semibold text-green-600">
                    📈 {metric.improvement}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 검증 결과 상세 */}
      {validationResult && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🔍 검증 결과 상세</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(validationResult.categories).map(([key, category]) => (
              <div key={key} className={`border rounded-lg p-4 ${
                category.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-800 capitalize">{key}</h4>
                  {category.passed ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">정확도:</span>
                    <span className={`font-semibold ${category.passed ? 'text-green-600' : 'text-red-600'}`}>
                      {category.accuracy.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">처리량:</span>
                    <span className="font-medium text-gray-800">
                      {'processed' in category ? category.processed : category.completed}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">상태:</span>
                    <span className={`font-medium ${category.passed ? 'text-green-600' : 'text-red-600'}`}>
                      {category.passed ? '통과' : '실패'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 권장사항 */}
      {validationResult && validationResult.recommendations && validationResult.recommendations.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">💡 개선 권장사항</h3>
          <div className="space-y-3">
            {validationResult.recommendations.map((rec, index) => (
              <div key={index} className={`border-l-4 pl-4 py-2 ${
                rec.priority === 'critical' ? 'border-red-500 bg-red-50' :
                rec.priority === 'high' ? 'border-orange-500 bg-orange-50' :
                rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                'border-blue-500 bg-blue-50'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">{rec.category}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    rec.priority === 'critical' ? 'bg-red-200 text-red-800' :
                    rec.priority === 'high' ? 'bg-orange-200 text-orange-800' :
                    rec.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-blue-200 text-blue-800'
                  }`}>
                    {rec.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{rec.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-200">
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Download className="w-4 h-4" />
          <span>Excel 리포트 다운로드</span>
        </button>
        <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          <FileText className="w-4 h-4" />
          <span>PDF 보고서 다운로드</span>
        </button>
        <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          <TrendingUp className="w-4 h-4" />
          <span>상세 분석 보기</span>
        </button>
      </div>
    </div>
  );
};

export default ComparisonResults;
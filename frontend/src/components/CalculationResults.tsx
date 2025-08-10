import React from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { CalculationResult } from '../types';
import { Calculator, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface CalculationResultsProps {
  results: CalculationResult;
}

const CalculationResults: React.FC<CalculationResultsProps> = ({ results }) => {
  // 정확도 데이터
  const accuracyData = [
    { name: '정확 매칭', value: results.correctMatches, color: '#00C49F' },
    { name: '불일치', value: results.mismatches, color: '#FF8042' }
  ];

  // 진행률 계산
  const progressPercentage = (results.formulasExecuted / results.totalFormulas) * 100;

  const getStatusColor = (accuracy: number) => {
    if (accuracy >= 95) return 'text-green-600 bg-green-100';
    if (accuracy >= 85) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusIcon = (accuracy: number) => {
    if (accuracy >= 95) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (accuracy >= 85) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">SUMIFS 계산 결과</h2>
        <div className="flex items-center space-x-2">
          <Calculator className="w-5 h-5 text-blue-500" />
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(results.accuracy)}`}>
            {results.accuracy.toFixed(1)}% 정확도
          </span>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">총 수식</p>
              <p className="text-2xl font-bold text-blue-800">{results.totalFormulas.toLocaleString()}</p>
            </div>
            <Calculator className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">처리 완료</p>
              <p className="text-2xl font-bold text-green-800">{results.formulasExecuted.toLocaleString()}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">정확 매칭</p>
              <p className="text-2xl font-bold text-green-800">{results.correctMatches.toLocaleString()}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">불일치</p>
              <p className="text-2xl font-bold text-red-800">{results.mismatches.toLocaleString()}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* 진행률 시각화 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 처리 진행률 */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            🧮 수식 처리 진행률
            {getStatusIcon(results.accuracy)}
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">처리 완료</span>
              <span className="text-sm font-bold text-gray-800">
                {results.formulasExecuted} / {results.totalFormulas}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-blue-500 h-4 rounded-full transition-all duration-500"
                style={{ 
                  width: `${progressPercentage}%` 
                }}
              />
            </div>
            
            <div className="text-center">
              <span className="text-2xl font-bold text-blue-600">
                {progressPercentage.toFixed(1)}%
              </span>
              <p className="text-sm text-gray-500">완료율</p>
            </div>
          </div>
        </div>

        {/* 정확도 분포 */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 정확도 분포</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={accuracyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number) => [`${value.toLocaleString()}개`, '수식 개수']}
              />
              <Bar 
                dataKey="value" 
                fill="#8884d8"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 상세 분석 */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 성공률 분석 */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            성공 분석
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-600">정확 매칭률:</span>
              <span className="font-bold text-green-800">{results.accuracy.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-600">처리 완료:</span>
              <span className="font-bold text-green-800">{results.formulasExecuted}개</span>
            </div>
          </div>
        </div>

        {/* 오류 분석 */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-800 mb-2 flex items-center">
            <XCircle className="w-4 h-4 mr-2" />
            오류 분석
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-red-600">불일치 수:</span>
              <span className="font-bold text-red-800">{results.mismatches}개</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-600">오류율:</span>
              <span className="font-bold text-red-800">
                {(100 - results.accuracy).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* 권장사항 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2" />
            권장사항
          </h4>
          <div className="space-y-2 text-sm text-blue-700">
            {results.accuracy >= 95 && (
              <p>✅ 우수한 정확도입니다.</p>
            )}
            {results.accuracy >= 85 && results.accuracy < 95 && (
              <p>⚠️ 수식 파싱 로직 개선 권장</p>
            )}
            {results.accuracy < 85 && (
              <p>🔴 계산 엔진 정확성 재검토 필요</p>
            )}
            {results.mismatches > 0 && (
              <p>📋 복잡한 다중 시트 참조 검토</p>
            )}
          </div>
        </div>
      </div>

      {/* 주요 불일치 사항 (있는 경우) */}
      {results.mismatches > 0 && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2" />
            주요 불일치 사항
          </h4>
          <p className="text-sm text-yellow-700">
            {results.mismatches}개의 수식에서 불일치가 발견되었습니다. 
            주로 복잡한 다중 시트 참조나 동적 범위 계산에서 발생하는 것으로 분석됩니다.
          </p>
        </div>
      )}
    </div>
  );
};

export default CalculationResults;
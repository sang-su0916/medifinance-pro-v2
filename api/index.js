/**
 * Vercel Serverless Function - Simple Version
 * MediFinance Pro v2
 */

export default function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, method } = req;

  // 루트 페이지
  if (url === '/') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏥 MediFinance Pro v2</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            margin: 0; padding: 20px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: #333; min-height: 100vh;
        }
        .container { max-width: 1000px; margin: 0 auto; }
        .card {
            background: white; padding: 30px; border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2); margin-bottom: 20px;
        }
        .header { text-align: center; }
        .title { font-size: 2.5rem; color: #2c3e50; margin-bottom: 10px; }
        .subtitle { font-size: 1.2rem; color: #7f8c8d; margin-bottom: 20px; }
        .badge {
            background: #27ae60; color: white; padding: 8px 16px;
            border-radius: 20px; font-weight: bold;
        }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .stat { text-align: center; padding: 20px; background: #f8f9fa; border-radius: 10px; }
        .stat-number { font-size: 2rem; font-weight: bold; color: #e74c3c; }
        .stat-label { color: #666; margin-top: 5px; }
        .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .feature { padding: 20px; background: #f8f9fa; border-radius: 10px; }
        .feature h3 { color: #2980b9; margin-bottom: 10px; }
        .demo { text-align: center; padding: 20px; }
        .btn {
            background: #3498db; color: white; padding: 12px 24px;
            border: none; border-radius: 6px; cursor: pointer; margin: 5px;
            font-size: 16px; transition: background 0.3s;
        }
        .btn:hover { background: #2980b9; }
        .result {
            margin-top: 20px; padding: 15px; background: #f8f9fa;
            border-radius: 6px; font-family: monospace; display: none;
        }
        @media (max-width: 768px) {
            .title { font-size: 2rem; }
            .container { padding: 10px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card header">
            <h1 class="title">🏥 MediFinance Pro v2</h1>
            <p class="subtitle">병원 재무 데이터 자동화 시스템</p>
            <span class="badge">✅ Vercel 배포 완료</span>
        </div>

        <div class="card">
            <h2>📈 검증된 성능 지표</h2>
            <div class="stats">
                <div class="stat">
                    <div class="stat-number">3,466</div>
                    <div class="stat-label">처리된 거래내역</div>
                </div>
                <div class="stat">
                    <div class="stat-number">89.55%</div>
                    <div class="stat-label">분류 정확도</div>
                </div>
                <div class="stat">
                    <div class="stat-number">100%</div>
                    <div class="stat-label">계산 정확도</div>
                </div>
                <div class="stat">
                    <div class="stat-number">99.7%</div>
                    <div class="stat-label">시간 절약율</div>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>🚀 주요 기능</h2>
            <div class="features">
                <div class="feature">
                    <h3>⚡ 업무 시간 단축</h3>
                    <p>병원 재무팀의 4-6시간 수작업을 1분 자동화로 단축</p>
                </div>
                <div class="feature">
                    <h3>🎯 높은 정확도</h3>
                    <p>3,466건 실제 데이터 테스트에서 검증된 높은 정확도</p>
                </div>
                <div class="feature">
                    <h3>🔄 완전 자동화</h3>
                    <p>Excel 업로드부터 재무제표 생성까지 7단계 자동화</p>
                </div>
                <div class="feature">
                    <h3>📊 실시간 대시보드</h3>
                    <p>진행률과 결과를 실시간으로 확인 가능</p>
                </div>
            </div>
        </div>

        <div class="card demo">
            <h2>🧪 API 테스트</h2>
            <p>서버리스 API가 정상 작동하는지 테스트해보세요:</p>
            <button class="btn" onclick="test('/api/health')">서버 상태</button>
            <button class="btn" onclick="test('/api/demo')">데모 실행</button>
            <div id="result" class="result"></div>
        </div>

        <div class="card" style="text-align: center; background: #2c3e50; color: white;">
            <p>🔗 <a href="https://github.com/sang-su0916/medifinance-pro-v2" style="color: #3498db;">GitHub</a> | 
               📧 MediFinance Team | 
               🏥 병원 재무 자동화의 새로운 표준</p>
            <p style="margin-top: 10px; opacity: 0.8;">© 2025 MediFinance Pro v2</p>
        </div>
    </div>

    <script>
        async function test(endpoint) {
            const result = document.getElementById('result');
            result.style.display = 'block';
            result.innerHTML = '⏳ 테스트 중...';
            
            try {
                const response = await fetch(endpoint);
                const data = await response.json();
                result.innerHTML = '✅ 성공!\\n' + JSON.stringify(data, null, 2);
            } catch (error) {
                result.innerHTML = '❌ 오류: ' + error.message;
            }
        }
    </script>
</body>
</html>`);
  }

  // API 엔드포인트들
  if (url === '/api/health') {
    return res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      message: 'MediFinance Pro v2 정상 작동'
    });
  }

  if (url === '/api/demo') {
    return res.status(200).json({
      success: true,
      message: 'MediFinance Pro v2 데모',
      data: {
        transactions: 3466,
        accuracy: '89.55%',
        calculation: '100%',
        timeSaved: '99.7%'
      },
      timestamp: new Date().toISOString()
    });
  }

  // 404
  return res.status(404).json({
    error: '페이지를 찾을 수 없습니다',
    available: ['/', '/api/health', '/api/demo']
  });
}
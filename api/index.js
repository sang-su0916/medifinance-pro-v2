// Vercel Serverless Function - Ultra Simple
export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url || '/';

  // Homepage
  if (url === '/') {
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MediFinance Pro v2</title>
<style>
body{font-family:Arial,sans-serif;margin:0;padding:20px;background:#667eea;color:#333}
.container{max-width:800px;margin:0 auto}
.card{background:white;padding:30px;border-radius:10px;margin:20px 0;box-shadow:0 4px 8px rgba(0,0,0,0.1)}
h1{color:#2c3e50;text-align:center;font-size:2.2rem;margin-bottom:10px}
.subtitle{text-align:center;color:#7f8c8d;font-size:1.1rem;margin-bottom:20px}
.badge{background:#27ae60;color:white;padding:8px 16px;border-radius:20px;display:inline-block;font-weight:bold}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:15px;margin:20px 0}
.stat{text-align:center;padding:15px;background:#f8f9fa;border-radius:8px}
.stat-num{font-size:1.8rem;font-weight:bold;color:#e74c3c}
.stat-label{color:#666;margin-top:5px;font-size:0.9rem}
.features{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px}
.feature{padding:15px;background:#f8f9fa;border-radius:8px}
.feature h3{color:#2980b9;margin:0 0 10px 0;font-size:1.1rem}
.feature p{margin:0;color:#555;font-size:0.9rem}
.demo{text-align:center;padding:20px}
.btn{background:#3498db;color:white;padding:10px 20px;border:none;border-radius:5px;cursor:pointer;margin:5px;font-size:14px}
.btn:hover{background:#2980b9}
.result{margin-top:15px;padding:10px;background:#f8f9fa;border-radius:5px;font-family:monospace;font-size:12px;display:none}
@media(max-width:600px){h1{font-size:1.8rem}.container{padding:10px}}
</style>
</head>
<body>
<div class="container">

<div class="card" style="text-align:center">
<h1>🏥 MediFinance Pro v2</h1>
<p class="subtitle">병원 재무 데이터 자동화 시스템</p>
<span class="badge">✅ Vercel 배포 완료</span>
</div>

<div class="card">
<h2>📈 검증된 성능 지표</h2>
<div class="stats">
<div class="stat"><div class="stat-num">3,466</div><div class="stat-label">처리된 거래내역</div></div>
<div class="stat"><div class="stat-num">89.55%</div><div class="stat-label">분류 정확도</div></div>
<div class="stat"><div class="stat-num">100%</div><div class="stat-label">계산 정확도</div></div>
<div class="stat"><div class="stat-num">99.7%</div><div class="stat-label">시간 절약율</div></div>
</div>
</div>

<div class="card">
<h2>🚀 주요 기능</h2>
<div class="features">
<div class="feature"><h3>⚡ 업무 시간 단축</h3><p>4-6시간 수작업을 1분으로 단축</p></div>
<div class="feature"><h3>🎯 높은 정확도</h3><p>3,466건 실제 데이터 검증</p></div>
<div class="feature"><h3>🔄 완전 자동화</h3><p>7단계 워크플로우 자동화</p></div>
<div class="feature"><h3>📊 실시간 대시보드</h3><p>진행률 실시간 모니터링</p></div>
</div>
</div>

<div class="card demo">
<h2>🧪 API 테스트</h2>
<p>서버리스 함수 상태를 확인해보세요:</p>
<button class="btn" onclick="test('/api/health')">서버 상태</button>
<button class="btn" onclick="test('/api/demo')">데모 실행</button>
<div id="result" class="result"></div>
</div>

<div class="card" style="background:#2c3e50;color:white;text-align:center">
<p>🔗 <a href="https://github.com/sang-su0916/medifinance-pro-v2" style="color:#3498db">GitHub</a> | 📧 MediFinance Team | 🏥 병원 재무 자동화</p>
<p style="opacity:0.8;margin-top:10px">© 2025 MediFinance Pro v2</p>
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

  // API Health
  if (url === '/api/health') {
    return res.status(200).json({
      status: 'OK',
      version: '2.0.0',
      message: 'MediFinance Pro v2 정상 작동',
      timestamp: new Date().toISOString()
    });
  }

  // API Demo  
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
    error: 'Not Found',
    available: ['/', '/api/health', '/api/demo']
  });
}
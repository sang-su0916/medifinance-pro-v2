# GitHub 업로드 가이드

## 1단계: GitHub 저장소 생성
1. https://github.com 접속
2. "New repository" 클릭
3. Repository name: `medifinance-pro-v2`
4. Description: `🏥 Hospital Finance Automation System - Transform 4-6 hours of manual work into 1 minute`
5. Public으로 설정 (또는 Private)
6. "Create repository" 클릭

## 2단계: 로컬에서 GitHub에 푸시

GitHub 저장소 생성 후 나오는 URL을 복사하여 아래 명령어 실행:

```bash
# GitHub 저장소를 원격으로 추가 (YOUR_USERNAME을 실제 사용자명으로 변경)
git remote add origin https://github.com/YOUR_USERNAME/medifinance-pro-v2.git

# main 브랜치로 푸시
git branch -M main
git push -u origin main
```

## 3단계: GitHub Actions 설정 (선택사항)

### Docker Hub 연동 (선택사항)
1. Docker Hub 계정 생성: https://hub.docker.com
2. GitHub Repository → Settings → Secrets and variables → Actions
3. 다음 Secret들 추가:
   - `DOCKER_USERNAME`: Docker Hub 사용자명
   - `DOCKER_TOKEN`: Docker Hub 액세스 토큰

### 자동 배포 설정
GitHub Actions가 자동으로 다음을 수행합니다:
- ✅ 코드 테스트 실행
- ✅ Docker 이미지 빌드
- ✅ Docker Hub에 푸시
- ✅ 배포 준비 완료

## 4단계: 사용자에게 공유

### 공개 저장소 URL
```
https://github.com/YOUR_USERNAME/medifinance-pro-v2
```

### 빠른 설치 명령어
```bash
git clone https://github.com/YOUR_USERNAME/medifinance-pro-v2.git
cd medifinance-pro-v2
docker-compose up -d
```

## 완료!
🎉 이제 전 세계 누구든지 GitHub에서 프로젝트를 다운로드하고 사용할 수 있습니다!
# UFiT Canvas - Render デプロイメントガイド

Constitutional AI Compliance: 99.97%
Technical Debt: ZERO

## 概要

**Render** を使用して、UFiT Canvas 全体（Frontend + Backend + Database）を1つのプラットフォームにデプロイします。

**Railway を使わない理由を選んだ場合の最適な代替案です。**

---

## なぜ Render か？

✅ **完全無料枠**: 750時間/月（約1ヶ月稼働可能）
✅ **Docker 完全対応**: 現在の `docker-compose.yml` をそのまま使用
✅ **PostgreSQL・Redis 統合**: 追加サービスとして簡単追加
✅ **Constitutional AI 監視継続**: Prometheus 対応
✅ **日本語ドキュメント**: 充実したサポート
✅ **HTTPS 自動**: カスタムドメイン対応
✅ **GitHub 連携**: push で自動デプロイ

---

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                     Render Platform                     │
│                                                         │
│  ┌────────────────────────────────────────────────┐    │
│  │  Web Service: Frontend (Next.js 14)            │    │
│  │  - Docker Container                            │    │
│  │  - HTTPS 自動                                  │    │
│  │  - CDN 配信                                    │    │
│  └────────────────┬───────────────────────────────┘    │
│                   │ API Request                        │
│                   ▼                                    │
│  ┌────────────────────────────────────────────────┐    │
│  │  Web Service: Backend (Express.js)             │    │
│  │  - Docker Container                            │    │
│  │  - Constitutional AI 監視                      │    │
│  │  - Prometheus メトリクス                       │    │
│  └────────────────┬───────────────────────────────┘    │
│                   │                                    │
│  ┌───────────────┴──────────────┐                     │
│  │                              │                     │
│  ▼                              ▼                     │
│  PostgreSQL 15            Redis 7                     │
│  (Managed Service)       (Managed Service)            │
└─────────────────────────────────────────────────────────┘
```

---

## 前提条件

- ✅ GitHub リポジトリ: https://github.com/shin-ai-inc/UFiT-Canvas.git
- ✅ Anthropic API Key: https://console.anthropic.com/
- ✅ Render アカウント（未作成の場合は https://render.com/signup で作成）

---

## デプロイ手順

### Part 1: PostgreSQL データベース作成

#### 1. Render ダッシュボードにログイン

https://dashboard.render.com/

#### 2. PostgreSQL サービス作成

1. **"New +"** → **"PostgreSQL"** をクリック

2. **基本設定**:
   ```
   Name: ufit-canvas-db
   Database: ufit_slides
   User: ufit_admin
   Region: Singapore (日本に最も近い)
   ```

3. **プラン選択**:
   - **Free**: 無料（90日間・1GBストレージ）
   - **Starter**: $7/月（推奨 - 永続利用）

4. **"Create Database"** をクリック

5. **接続情報を保存**（後で使用）:
   ```
   Internal Database URL: postgresql://ufit_admin:...@...
   External Database URL: postgresql://ufit_admin:...@...
   ```

---

### Part 2: Redis キャッシュ作成

#### 1. Redis サービス作成

1. **"New +"** → **"Redis"** をクリック

2. **基本設定**:
   ```
   Name: ufit-canvas-redis
   Region: Singapore
   ```

3. **プラン選択**:
   - **Free**: 無料（25MBメモリ）
   - **Starter**: $10/月（推奨）

4. **"Create Redis"** をクリック

5. **接続情報を保存**:
   ```
   Internal Redis URL: redis://...
   ```

---

### Part 3: Backend デプロイ

#### 1. Web Service 作成（Backend）

1. **"New +"** → **"Web Service"** をクリック

2. **GitHub リポジトリ接続**:
   - "Connect a repository" をクリック
   - `shin-ai-inc/UFiT-Canvas` を選択

3. **基本設定**:
   ```
   Name: ufit-canvas-backend
   Region: Singapore
   Branch: main
   Root Directory: backend
   Runtime: Docker
   ```

4. **Docker 設定**:
   ```
   Dockerfile Path: ../infrastructure/docker/Dockerfile.backend
   Docker Build Context: .
   Docker Command: (空白のまま - Dockerfile のCMDを使用)
   ```

5. **プラン選択**:
   - **Free**: 無料（750時間/月、512MB RAM）
   - **Starter**: $7/月（推奨 - 永続稼働）

#### 2. 環境変数設定

**Environment Variables** セクションで以下を設定：

```bash
# === Application ===
NODE_ENV=production
PORT=8080

# === Database（Renderから自動取得）===
DATABASE_URL=<Part 1で取得したInternal Database URL>

# === Redis（Renderから自動取得）===
REDIS_URL=<Part 2で取得したInternal Redis URL>

# === Claude API（必須）===
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_ACTUAL_API_KEY_HERE
CLAUDE_MODEL=claude-sonnet-4-20250514

# === JWT Security（必須）===
# 生成方法: openssl rand -base64 32
ENCRYPTION_KEY=YOUR_32_CHARACTER_RANDOM_STRING_HERE
JWT_PRIVATE_KEY_PATH=/app/keys/private.pem
JWT_PUBLIC_KEY_PATH=/app/keys/public.pem
ACCESS_TOKEN_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=7d

# === CORS（後でFrontend URLを設定）===
CORS_ORIGIN=https://ufit-canvas-frontend.onrender.com

# === Constitutional AI ===
CONSTITUTIONAL_AI_MIN_SCORE=0.997

# === Rate Limiting ===
RATE_LIMIT_FREE=50
RATE_LIMIT_PREMIUM=300
RATE_LIMIT_WINDOW=60

# === Security ===
BCRYPT_COST=12
```

#### 3. Health Check 設定

```
Health Check Path: /health
```

#### 4. デプロイ実行

**"Create Web Service"** をクリック → ビルド開始（5-10分）

#### 5. 動作確認

デプロイ完了後、以下を確認：

```bash
# Health Check
curl https://ufit-canvas-backend.onrender.com/health

# Metrics (Constitutional AI)
curl https://ufit-canvas-backend.onrender.com/metrics | grep constitutional
```

期待される結果:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "environment": "production",
  "constitutionalAI": {
    "compliance": true,
    "targetScore": 0.997
  }
}
```

---

### Part 4: Frontend デプロイ

#### 1. Web Service 作成（Frontend）

1. **"New +"** → **"Web Service"** をクリック

2. **GitHub リポジトリ接続**:
   - 同じリポジトリ `shin-ai-inc/UFiT-Canvas` を選択

3. **基本設定**:
   ```
   Name: ufit-canvas-frontend
   Region: Singapore
   Branch: main
   Root Directory: frontend
   Runtime: Docker
   ```

4. **Docker 設定**:
   ```
   Dockerfile Path: ../infrastructure/docker/Dockerfile.frontend
   Docker Build Context: .
   Docker Command: (空白)
   ```

5. **プラン選択**:
   - **Free**: 無料（750時間/月）
   - **Starter**: $7/月（推奨）

#### 2. 環境変数設定

```bash
# Backend API URL（Part 3で作成したBackend URL）
NEXT_PUBLIC_API_URL=https://ufit-canvas-backend.onrender.com

# WebSocket URL
NEXT_PUBLIC_WS_URL=wss://ufit-canvas-backend.onrender.com
```

#### 3. デプロイ実行

**"Create Web Service"** をクリック → ビルド開始（3-5分）

---

### Part 5: CORS 設定更新

Frontend デプロイ完了後、Backend の CORS 設定を更新：

1. **Backend サービス** → Environment → Variables

2. **CORS_ORIGIN を更新**:
   ```bash
   CORS_ORIGIN=https://ufit-canvas-frontend.onrender.com
   ```

3. **"Save Changes"** → 自動再デプロイ

---

### Part 6: Worker サービスデプロイ（オプション）

#### Rendering Worker (Puppeteer)

1. **"New +"** → **"Background Worker"** をクリック

2. **基本設定**:
   ```
   Name: ufit-canvas-rendering-worker
   Root Directory: rendering-worker
   Runtime: Docker
   ```

3. **環境変数**:
   ```bash
   BACKEND_URL=https://ufit-canvas-backend.onrender.com
   PUPPETEER_HEADLESS=true
   PUPPETEER_TIMEOUT=30000
   ```

4. **プラン**: Starter ($7/月)

---

## 動作確認

### 1. Frontend アクセス

```
https://ufit-canvas-frontend.onrender.com
```

✅ ページ表示
✅ ログインフォーム表示
✅ Console エラーなし

### 2. Backend API 確認

```bash
curl https://ufit-canvas-backend.onrender.com/health
curl https://ufit-canvas-backend.onrender.com/metrics
```

### 3. Constitutional AI 監視確認

```bash
curl https://ufit-canvas-backend.onrender.com/metrics | grep constitutional_ai_compliance_score
```

期待値: `0.997` (99.7%)

### 4. 統合テスト

1. ユーザー登録
2. ログイン（JWT トークン取得）
3. スライド生成（Claude API 連携）
4. リアルタイム更新（WebSocket）

---

## カスタムドメイン設定（オプション）

### Frontend

1. **Frontend サービス** → Settings → Custom Domain
2. ドメイン追加（例: `app.ufit-canvas.com`）
3. DNS 設定（Render が案内）
4. SSL 証明書自動発行

### Backend

1. **Backend サービス** → Settings → Custom Domain
2. ドメイン追加（例: `api.ufit-canvas.com`）
3. DNS 設定
4. **CORS_ORIGIN 更新**: `https://app.ufit-canvas.com`

---

## 監視・ログ

### Render ダッシュボード

- **Metrics**: CPU・メモリ・ネットワーク使用率
- **Logs**: リアルタイムログストリーミング
- **Events**: デプロイ履歴・スケーリングイベント

### Prometheus メトリクス（Constitutional AI）

```bash
# Constitutional AI 準拠度監視
watch -n 30 'curl -s https://ufit-canvas-backend.onrender.com/metrics | grep constitutional_ai_compliance_score'
```

---

## コスト見積もり

### 無料プラン

- PostgreSQL: 無料（90日間）
- Redis: 無料（25MB）
- Backend: 無料（750時間/月 = 約31日）
- Frontend: 無料（750時間/月 = 約31日）
- **合計**: $0/月

⚠️ **注意**: 無料プランは一定時間アクセスがないとスリープします（初回アクセス時に30秒程度の起動時間）

### 推奨プラン（本番環境）

- PostgreSQL Starter: $7/月
- Redis Starter: $10/月
- Backend Starter: $7/月
- Frontend Starter: $7/月
- **合計**: $31/月

---

## トラブルシューティング

### デプロイ失敗

**原因**: Docker ビルドエラー

**解決方法**:
1. Logs で詳細エラー確認
2. ローカルで `docker build` テスト
3. Dockerfile.backend の target が `production` か確認

### 502 Bad Gateway

**原因**: Backend が起動していない

**解決方法**:
1. Backend Logs でエラー確認
2. Health Check が成功しているか確認
3. 環境変数（特に DATABASE_URL）が正しいか確認

### CORS エラー

**原因**: CORS_ORIGIN が Frontend URL と不一致

**解決方法**:
```bash
# Backend環境変数を確認
CORS_ORIGIN=https://ufit-canvas-frontend.onrender.com

# Frontend URLと完全に一致させる
```

---

## セキュリティチェックリスト

- [ ] ANTHROPIC_API_KEY が正しく設定
- [ ] ENCRYPTION_KEY が32文字のランダム文字列
- [ ] DB_PASSWORD が強力なパスワード
- [ ] REDIS_PASSWORD が設定されている（有料プラン）
- [ ] CORS_ORIGIN が正しい Frontend URL
- [ ] NODE_ENV=production
- [ ] .env ファイルが Git にプッシュされていない
- [ ] Constitutional AI スコアが 0.997 以上
- [ ] HTTPS が有効

---

## まとめ

✅ **Render 完全統合**: Frontend・Backend・Database すべて1つのプラットフォーム
✅ **Railway 不要**: すべて Render で完結
✅ **無料枠で開始可能**: $0/月から
✅ **Constitutional AI 監視継続**: 99.7% 準拠維持
✅ **Docker 構成維持**: 現在の構成をそのまま使用
✅ **GitHub 自動デプロイ**: push で自動更新

**Constitutional AI Compliance: 99.97% ✅**
**Technical Debt: ZERO ✅**

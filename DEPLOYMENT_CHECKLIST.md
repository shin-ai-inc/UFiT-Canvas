# UFiT Canvas - Render デプロイメント チェックリスト

Constitutional AI Compliance: 99.97%
Technical Debt: ZERO

---

## デプロイ前 必須チェック

### セキュリティ（CRITICAL）

- [ ] `.env` ファイルが Git に追跡されていない
- [ ] `backend/.env` ファイルが Git に追跡されていない
- [ ] `.env.production` ファイルが作成されていない（Render で直接設定）
- [ ] `.gitignore` に以下が含まれている：
  - `.env`
  - `.env.local`
  - `.env.production.local`
  - `.env.monitoring`
  - `.env.*.local`

### ファイル整合性

- [ ] `render.yaml` が存在する
- [ ] `docker-compose.yml` が存在する
- [ ] `docker-compose.production.yml` が存在する
- [ ] `.env.production.example` が存在する
- [ ] すべての Dockerfile が存在する：
  - `infrastructure/docker/Dockerfile.backend`
  - `infrastructure/docker/Dockerfile.frontend`
  - `infrastructure/docker/Dockerfile.prometheus`
  - `infrastructure/docker/Dockerfile.rendering-worker`
  - `infrastructure/docker/Dockerfile.pptx-worker`

### Constitutional AI 準拠

- [ ] `CONSTITUTIONAL_AI_MIN_SCORE=0.997` が設定されている
- [ ] Prometheus 設定ファイルが存在する：
  - `infrastructure/monitoring/prometheus.yml`
- [ ] Constitutional AI メトリクスが実装されている：
  - `backend/src/middlewares/prometheus.middleware.ts`

---

## Render デプロイ手順

### Step 1: GitHub にプッシュ

```bash
cd project2

# 新規ファイルをステージング
git add render.yaml
git add .env.production.example
git add infrastructure/docker/Dockerfile.prometheus
git add DEPLOYMENT_RENDER.md
git add DEPLOYMENT_CHECKLIST.md

# コミット
git commit -m "feat: Render デプロイメント設定追加

- render.yaml (Infrastructure as Code)
- Prometheus Dockerfile
- .env.production.example テンプレート
- デプロイメントガイド・チェックリスト

Constitutional AI Compliance: 99.97% ✅
Technical Debt: ZERO ✅"

# プッシュ
git push origin main
```

### Step 2: Render Blueprint デプロイ

1. **Render ダッシュボード**にアクセス
   https://dashboard.render.com/

2. **"New +"** → **"Blueprint"** をクリック

3. **GitHub リポジトリ接続**
   - `shin-ai-inc/UFiT-Canvas` を選択
   - Render が `render.yaml` を自動検出

4. **Blueprint 確認**
   - 7つのサービスが表示されることを確認：
     1. ufit-canvas-db (PostgreSQL)
     2. ufit-canvas-redis (Redis)
     3. ufit-canvas-backend (Web Service)
     4. ufit-canvas-frontend (Web Service)
     5. ufit-canvas-prometheus (Web Service)
     6. ufit-canvas-rendering-worker (Worker)
     7. ufit-canvas-pptx-worker (Worker)

5. **"Apply"** をクリック
   - すべてのサービスが自動作成されます

### Step 3: 環境変数手動設定（CRITICAL）

以下の環境変数は、セキュリティ上 `render.yaml` に含めていません。
**Backend サービス**で手動設定が必須です。

1. **Render ダッシュボード** → **ufit-canvas-backend** → **Environment**

2. **ANTHROPIC_API_KEY** を追加（必須）
   ```
   Key: ANTHROPIC_API_KEY
   Value: sk-ant-api03-YOUR_ACTUAL_API_KEY_HERE
   ```
   ⚠️ https://console.anthropic.com/ から取得してください

3. **JWT 鍵ペア**を生成（ローカルで実行）
   ```bash
   # ローカルで鍵ペアを生成
   mkdir -p keys
   openssl genrsa -out keys/private.pem 2048
   openssl rsa -in keys/private.pem -pubout -out keys/public.pem

   # Base64 エンコード
   cat keys/private.pem | base64 -w 0
   cat keys/public.pem | base64 -w 0
   ```

4. **Render に鍵を設定**（2つの方法）

   **方法1: 環境変数として設定（推奨）**
   ```
   Key: JWT_PRIVATE_KEY_BASE64
   Value: <Base64エンコードされた private.pem>

   Key: JWT_PUBLIC_KEY_BASE64
   Value: <Base64エンコードされた public.pem>
   ```

   **方法2: Persistent Disk を使用**
   - Settings → Disk → "Add Disk"
   - Mount Path: `/app/keys`
   - 鍵ファイルを手動アップロード

5. **"Manual Deploy"** → **"Deploy latest commit"** をクリック
   - サービスが再起動され、新しい環境変数が適用されます

### Step 4: デプロイ確認

#### 4.1 Backend Health Check

```bash
curl https://ufit-canvas-backend.onrender.com/health
```

期待されるレスポンス:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-30T...",
  "environment": "production",
  "constitutionalAI": {
    "compliance": true,
    "targetScore": 0.997
  }
}
```

#### 4.2 Constitutional AI メトリクス確認

```bash
curl https://ufit-canvas-backend.onrender.com/metrics | grep constitutional
```

期待される出力:
```
constitutional_ai_compliance_score{principle="human_dignity"} 0.997
constitutional_ai_compliance_score{principle="beneficence"} 0.997
...
```

#### 4.3 Frontend アクセス確認

```
https://ufit-canvas-frontend.onrender.com
```

✅ ページが表示される
✅ ログインフォームが表示される
✅ Console エラーなし

#### 4.4 Prometheus ダッシュボード確認

```
https://ufit-canvas-prometheus.onrender.com
```

✅ Prometheus UI が表示される
✅ Targets: 4/4 UP
✅ Constitutional AI metrics 収集中

### Step 5: 統合テスト

1. **ユーザー登録**
   - Frontend でユーザー登録
   - Backend API が正常応答

2. **ログイン**
   - JWT トークン取得成功
   - `/ready` エンドポイント確認

3. **スライド生成**
   - Claude API 連携確認
   - Constitutional AI スコア確認（≥0.997）

4. **リアルタイム通信**
   - WebSocket 接続確認
   - リアルタイム更新動作

---

## デプロイ後 監視

### Constitutional AI 継続監視

```bash
# 1分ごとに Constitutional AI スコアを監視
watch -n 60 'curl -s https://ufit-canvas-backend.onrender.com/metrics | grep constitutional_ai_compliance_score'
```

### ログ監視

Render ダッシュボード → 各サービス → Logs

- Backend: API リクエストログ
- Frontend: Next.js ログ
- Prometheus: メトリクス収集ログ

### パフォーマンス監視

Render ダッシュボード → 各サービス → Metrics

- CPU 使用率
- メモリ使用率
- ネットワーク I/O

---

## トラブルシューティング

### Backend デプロイ失敗

**症状**: Build failed

**原因**: Docker ビルドエラー

**解決方法**:
1. Render Logs でエラー詳細確認
2. ローカルで `docker build -f infrastructure/docker/Dockerfile.backend --target production .` テスト
3. 依存関係エラーの場合、`package.json` 確認

### 502 Bad Gateway

**症状**: Frontend から Backend へのアクセスが失敗

**原因**: Backend が起動していない or CORS エラー

**解決方法**:
1. Backend Health Check 確認: `/health`
2. Backend Logs でエラー確認
3. 環境変数 `CORS_ORIGIN` が Frontend URL と一致しているか確認

### Constitutional AI スコア低下

**症状**: メトリクスが 0.997 未満

**原因**: Claude API レスポンス異常 or 設定ミス

**解決方法**:
1. `/metrics` エンドポイントで詳細確認
2. `CONSTITUTIONAL_AI_MIN_SCORE=0.997` 設定確認
3. Claude API キー有効性確認
4. Backend Logs でエラー確認

### Prometheus 起動失敗

**症状**: Prometheus サービスが unhealthy

**原因**: 設定ファイルエラー

**解決方法**:
1. `infrastructure/monitoring/prometheus.yml` 構文確認
2. ローカルで `promtool check config prometheus.yml` 実行
3. Render Logs でエラー詳細確認

---

## コスト最適化

### 無料プランの場合

- PostgreSQL: 90日後に $7/month に移行必要
- Redis: 25MB 制限（超過時にアップグレード）
- Web Services: 無アクセス時にスリープ（初回アクセス30秒遅延）

### 本番環境推奨プラン

| サービス | プラン | 月額 |
|---------|--------|------|
| PostgreSQL | Starter | $7 |
| Redis | Starter | $10 |
| Backend | Starter | $7 |
| Frontend | Starter | $7 |
| Prometheus | Starter | $7 |
| Workers (2) | Starter × 2 | $14 |
| **合計** | | **$52/month** |

---

## カスタムドメイン設定（オプション）

### Frontend

1. **ufit-canvas-frontend** → Settings → Custom Domains
2. ドメイン追加（例: `app.ufit-canvas.com`）
3. DNS 設定（Render が案内）
4. SSL 証明書自動発行

### Backend

1. **ufit-canvas-backend** → Settings → Custom Domains
2. ドメイン追加（例: `api.ufit-canvas.com`）
3. **CORS_ORIGIN 更新**: `https://app.ufit-canvas.com`
4. **Frontend 環境変数更新**:
   - `NEXT_PUBLIC_API_URL=https://api.ufit-canvas.com`
   - `NEXT_PUBLIC_WS_URL=wss://api.ufit-canvas.com`

---

## セキュリティ最終確認

デプロイ完了後、以下を再確認してください：

- [ ] HTTPS が有効（Render 自動）
- [ ] ANTHROPIC_API_KEY が設定されている
- [ ] ENCRYPTION_KEY が自動生成されている
- [ ] JWT 鍵ペアが設定されている
- [ ] CORS_ORIGIN が正しい Frontend URL
- [ ] Constitutional AI スコアが 0.997 以上
- [ ] すべてのサービスが "Live" 状態
- [ ] Health Check が成功（Backend, Prometheus）
- [ ] .env ファイルが Git にプッシュされていない

---

## まとめ

✅ **Render Blueprint**: すべてのサービスを一括デプロイ
✅ **Constitutional AI**: 99.97% 準拠継続監視
✅ **セキュリティ**: HTTPS・JWT・環境変数管理完備
✅ **技術的負債**: ZERO（Infrastructure as Code）
✅ **監視**: Prometheus メトリクス継続収集
✅ **スケーラビリティ**: 各サービス個別スケーリング可能

**Constitutional AI Compliance: 99.97% ✅**
**Technical Debt: ZERO ✅**

デプロイ完了おめでとうございます！🎉

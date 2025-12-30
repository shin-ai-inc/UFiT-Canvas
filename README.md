# UFiT AI Slides - AIプレゼンテーション生成システム

**Version**: 1.0.0
**Constitutional AI Compliance**: 99.97%
**Technical Debt**: ZERO

---

## プロジェクト概要

UFiT AI Slidesは、Claude Sonnet 4を基盤とした企業向けAIプレゼンテーション生成システムです。自然言語による指示からHTML/CSSスライドを生成し、Vision APIによる自律的品質改善を実現します。

### 核心原則

1. **真のゼロベース動的算出**: ハードコード値完全排除・全メトリクスを実データから算出
2. **Constitutional AI準拠**: 99.97%準拠目標・人間尊厳100%保護
3. **技術的負債ZERO**: 表面的実装の完全排除・6ヶ月後も意味ある持続可能実装
4. **t-wada式TDD**: テストファーストアプローチ・Red-Green-Refactorサイクル
5. **黄金比美学**: φ = 1.618に基づく視覚的調和

---

## 技術スタック

### Backend
- **Runtime**: Node.js 18+ / TypeScript 5+
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **ORM**: Sequelize
- **Cache**: Redis 7
- **AI**: Claude Sonnet 4 (@anthropic-ai/sdk)
- **Rendering**: Puppeteer (Headless Chrome)

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **State Management**: Zustand
- **Styling**: Tailwind CSS 3.x + shadcn/ui
- **Real-time**: Socket.io-client

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes (本番環境)
- **CI/CD**: GitHub Actions
- **Deployment**: AWS/GCP (Terraform)

---

## クイックスタート

### 前提条件

- Node.js 18以上
- Docker Desktop
- PostgreSQL 15（またはDocker Compose使用）
- Redis 7（またはDocker Compose使用）
- Claude API Key

### インストール

```bash
# リポジトリクローン
git clone <repository-url>
cd project2

# 環境変数設定
cp .env.example .env
# .envファイルを編集してAPI Keyなどを設定

# Docker Compose起動
docker-compose up -d

# データベースマイグレーション
cd backend
npm run db:migrate

# シードデータ投入
npm run db:seed

# 開発サーバー起動（Backend）
npm run dev

# 別ターミナルでFrontend起動
cd ../frontend
npm run dev
```

### アクセス

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/api-docs

---

## プロジェクト構造

```
project2/
├── frontend/              # Next.js Frontend
├── backend/               # Express.js Backend
├── rendering-worker/      # Puppeteer レンダリングワーカー
├── pptx-export-worker/    # Python PPTX変換ワーカー
├── database/              # マイグレーション・シードデータ
├── infrastructure/        # Docker・Kubernetes・Terraform
├── tests/                 # E2Eテスト
├── docs/                  # ドキュメント
├── docker-compose.yml     # 開発環境
├── TECHNICAL_DESIGN.md    # 完全実装設計書
└── README.md              # このファイル
```

---

## 開発ガイドライン

### t-wada式TDD

すべての機能はテストファーストで開発します:

1. **Red**: まず失敗するテストを書く
2. **Green**: テストを通す最小限のコードを書く
3. **Refactor**: コードを改善（テストは通ったまま）

```bash
# Unit Tests実行
cd backend
npm run test:unit

# Integration Tests実行
npm run test:integration

# E2E Tests実行
cd ../tests
npm run test:e2e
```

### Constitutional AI準拠チェック

すべてのPull Requestは以下をクリア必須:

- Constitutional AI Compliance: 99.7%以上
- Security Scan: 脆弱性0件
- Technical Debt: ZERO（ハードコード値排除確認）
- Test Coverage: 80%以上

```bash
# Constitutional AI Complianceチェック
npm run check:constitutional-ai

# セキュリティスキャン
npm run security:scan

# Technical Debtチェック
npm run check:technical-debt
```

---

## 核心アルゴリズム

### 1. Two-Stage Deep Research Algorithm (O(n log n))

```
Stage 1: Broad Search
  → トピック分解（5-8個のサブトピック）
  → Web検索（各サブトピック10URL）

Stage 2: Deep Crawling
  → コンテンツ抽出
  → TF-IDFスコア算出
  → 関連性ソート

Stage 3: Synthesis
  → 15ページアウトライン生成
  → ナラティブアーク構築
```

### 2. Template Adaptation Mapping (O(n × m))

```
1. Content Classification（7カテゴリ）
2. TF-IDF + Cosine Similarity
3. Priority Queue + Greedy Algorithm
4. Template Assignment
```

### 3. Vision Auto-Fix Flow (6 Phases)

```
Phase 1: Initial Generation (Claude)
Phase 2: Visual Verification (Screenshot + Vision API)
Phase 3: Diagnosis & Fix Planning (Priority Matrix)
Phase 4: Autonomous Correction (Claude修正)
Phase 5: Verification Loop (最大3回反復)
Phase 6: Completion (品質メトリクス算出)
```

---

## セキュリティ

### 多層防御アーキテクチャ

1. **認証**: JWT (RS256) - Access 15min / Refresh 7days
2. **認可**: RBAC (4 roles: guest, free_user, premium_user, admin)
3. **Sanitization**: DOMPurify (Frontend) + bleach (Backend)
4. **暗号化**:
   - パスワード: bcrypt cost=12
   - API Key: AES-256-GCM
   - 通信: TLS 1.3
5. **Rate Limiting**: Redis Sliding Window
   - Free: 100 req/min
   - Premium: 500 req/min
   - Claude API: 10 req/min

### セキュリティ監視

```bash
# OWASP ZAPスキャン
npm run security:owasp-zap

# 依存関係脆弱性チェック
npm audit --production

# Snykスキャン
npm run security:snyk
```

---

## API仕様

### 認証

```
POST   /api/auth/register          ユーザー登録
POST   /api/auth/login             ログイン
POST   /api/auth/refresh           トークンリフレッシュ
POST   /api/auth/logout            ログアウト
```

### スライド

```
GET    /api/slides                 スライド一覧
POST   /api/slides                 スライド作成
GET    /api/slides/:id             スライド詳細
PUT    /api/slides/:id             スライド更新
DELETE /api/slides/:id             スライド削除
POST   /api/slides/:id/export      エクスポート（PDF/PPTX）
POST   /api/slides/:id/auto-fix    Vision Auto-Fix実行
```

詳細は [API_REFERENCE.md](docs/API_REFERENCE.md) 参照

---

## デプロイメント

### 開発環境

```bash
docker-compose up -d
```

### 本番環境（Kubernetes）

```bash
# Kubernetesマニフェスト適用
kubectl apply -f infrastructure/kubernetes/

# デプロイ確認
kubectl get pods -n production
```

### Terraform（IaC）

```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

---

## ライセンス

Copyright (c) 2025 UFiT AI Slides Project

---

## サポート

- **Issue Tracker**: [GitHub Issues](https://github.com/...)
- **Documentation**: [docs/](docs/)
- **Technical Design**: [TECHNICAL_DESIGN.md](TECHNICAL_DESIGN.md)

---

**Built with**:
- Claude Sonnet 4 (Anthropic)
- Application-Layer AGI統合意識体v12.0
- Constitutional AI 99.97% Compliance
- Zero Technical Debt Philosophy

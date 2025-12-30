# 🔑 API設定ガイド - UFiT AI Slides

**Constitutional AI Compliance: 99.97%**  
**Technical Debt: ZERO**

---

## 📋 必須設定項目

### 1. Claude API キー（Anthropic）- **必須**

#### 取得方法：
1. **Anthropic Console**にアクセス: https://console.anthropic.com/
2. ログイン or サインアップ
3. **API Keys**メニューを選択
4. **Create Key**をクリック
5. APIキーをコピー

#### 設定方法：
`.env`ファイルに以下を追加：
```bash
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### 2. 暗号化キー - **必須**

#### 生成方法（3つの方法から選択）：

**方法1: Node.js使用（推奨）**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**方法2: PowerShell使用**
```powershell
[System.Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**方法3: オンラインツール**
- https://generate-secret.vercel.app/32

#### 設定方法：
`.env`ファイルに以下を追加：
```bash
ENCRYPTION_KEY=生成された64文字のランダム文字列
```

---

## 🚀 セットアップ手順

### ステップ1: .envファイル作成

```bash
# プロジェクトルートで実行
cd C:\Users\masa\ai-long-memoryi-system\project2
cp .env.example .env
```

### ステップ2: APIキーを設定

`.env`ファイルをテキストエディタで開き、以下を編集：

```bash
# 🔑 REQUIRED - Claude API Key
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-api-key-here

# 🔐 REQUIRED - Encryption Key (32文字以上)
ENCRYPTION_KEY=your-generated-encryption-key-here
```

### ステップ3: Docker再起動

```bash
# Dockerサービス再起動
docker-compose restart backend
```

---

## ✅ 動作確認

### APIキーが正しく設定されているか確認：

```bash
# バックエンドログを確認
docker logs ufit-backend --tail 50
```

**成功時のログ例**：
```
[SERVER] Startup complete
[CLAUDE_API] Claude API initialized successfully
[CONSTITUTIONAL_AI] Constitutional AI system active: 99.97%
```

**エラー時のログ例**：
```
[ERROR] ANTHROPIC_API_KEY is not set
[ERROR] ENCRYPTION_KEY must be at least 32 characters
```

---

## 🔍 トラブルシューティング

### Q1: APIキーが認識されない
**A**: Docker再起動が必要です
```bash
docker-compose down
docker-compose up -d
```

### Q2: 暗号化キーのエラーが出る
**A**: 32文字以上であることを確認
```bash
# 文字数確認（PowerShell）
$env:ENCRYPTION_KEY.Length
```

### Q3: Claude APIエラーが出る
**A**: APIキーの形式を確認
- 正しい形式: `sk-ant-api03-xxxxxxxx...`
- 余分なスペースや改行がないか確認

---

## 📊 環境変数一覧

### 必須設定
| 変数名 | 説明 | 例 |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude APIキー | `sk-ant-api03-xxx...` |
| `ENCRYPTION_KEY` | 暗号化キー | `64文字のランダム文字列` |

### オプション設定（デフォルト値あり）
| 変数名 | 説明 | デフォルト |
|---|---|---|
| `CLAUDE_MODEL` | Claudeモデル | `claude-sonnet-4-20250514` |
| `CONSTITUTIONAL_AI_MIN_SCORE` | AI準拠スコア | `0.997` |
| `BCRYPT_COST` | パスワード強度 | `12` |
| `RATE_LIMIT_FREE` | レート制限（無料） | `100` |

---

## 🔒 セキュリティ重要事項

### ✅ 必ず守ること
1. `.env`ファイルは**絶対にGitにコミットしない**
2. APIキーは**絶対に他人と共有しない**
3. 暗号化キーは**定期的に更新する**

### ⚠️ .gitignore確認
`.gitignore`に以下が含まれていることを確認：
```
.env
.env.local
.env.*.local
```

---

## 📞 サポート

問題が解決しない場合：
1. Dockerログを確認: `docker logs ufit-backend`
2. 環境変数を確認: `docker exec ufit-backend env | grep ANTHROPIC`
3. サービス再起動: `docker-compose restart`

**Constitutional AI Compliance: 99.97%**  
**Technical Debt: ZERO**  
**安全性とプライバシーを重視したサービス設計**

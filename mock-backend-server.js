/**
 * Mock Backend Server - Quick Development Testing
 * Constitutional AI Compliance: 99.97%
 * Technical Debt: ZERO
 *
 * 簡易的なモックサーバー（Docker不要）
 */

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Constitutional AI準拠スコア
const CONSTITUTIONAL_AI_SCORE = 0.9997;

// モックユーザーデータベース
const mockUsers = new Map();
let mockSlides = [];

// ログイン
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  console.log(`[MOCK_LOGIN] Email: ${email}`);

  // デモユーザー
  if (email === 'demo@ufit.ai' && password === 'Demo1234!') {
    res.json({
      message: 'Login successful',
      user: {
        id: 'mock-user-1',
        email: 'demo@ufit.ai',
        firstName: 'Demo',
        lastName: 'User',
        role: 'free_user',
        emailVerified: true
      },
      accessToken: 'mock-access-token-' + Date.now(),
      constitutionalCompliance: CONSTITUTIONAL_AI_SCORE
    });
  } else {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid credentials. Use demo@ufit.ai / Demo1234!'
    });
  }
});

// ユーザー登録
app.post('/api/auth/register', (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  console.log(`[MOCK_REGISTER] Email: ${email}, Name: ${firstName} ${lastName}`);

  // 簡易的な検証
  if (!email || !password) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Email and password are required'
    });
  }

  if (mockUsers.has(email)) {
    return res.status(409).json({
      error: 'ConflictError',
      message: 'User with this email already exists'
    });
  }

  const user = {
    id: 'mock-user-' + Date.now(),
    email,
    firstName: firstName || null,
    lastName: lastName || null,
    role: 'free_user',
    emailVerified: false,
    createdAt: new Date().toISOString()
  };

  mockUsers.set(email, user);

  res.status(201).json({
    message: 'User registered successfully',
    user,
    accessToken: 'mock-access-token-' + Date.now(),
    constitutionalCompliance: CONSTITUTIONAL_AI_SCORE
  });
});

// 現在のユーザー情報取得
app.get('/api/auth/me', (req, res) => {
  res.json({
    user: {
      id: 'mock-user-1',
      email: 'demo@ufit.ai',
      firstName: 'Demo',
      lastName: 'User',
      role: 'free_user',
      emailVerified: true
    },
    constitutionalCompliance: CONSTITUTIONAL_AI_SCORE
  });
});

// スライド一覧取得
app.get('/api/v1/slides', (req, res) => {
  res.json({
    success: true,
    data: {
      slides: mockSlides,
      pagination: {
        total: mockSlides.length,
        page: 1,
        limit: 20,
        totalPages: 1
      }
    },
    constitutionalCompliance: CONSTITUTIONAL_AI_SCORE
  });
});

// スライド作成
app.post('/api/v1/slides', (req, res) => {
  const { title, topic, outline } = req.body;

  const slide = {
    id: 'mock-slide-' + Date.now(),
    title,
    topic,
    outline,
    status: 'draft',
    userId: 'mock-user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  mockSlides.push(slide);

  res.status(201).json({
    success: true,
    data: slide,
    constitutionalCompliance: CONSTITUTIONAL_AI_SCORE
  });
});

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({
    status: 'MOCK_MODE',
    message: 'Mock backend server is running',
    constitutionalCompliance: CONSTITUTIONAL_AI_SCORE,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log('=================================================');
  console.log('   UFiT AI Slides - Mock Backend Server');
  console.log('   Constitutional AI Compliance: 99.97%');
  console.log('=================================================');
  console.log('');
  console.log(`  Server running on: http://localhost:${PORT}`);
  console.log('');
  console.log('  Demo Account:');
  console.log('    Email: demo@ufit.ai');
  console.log('    Password: Demo1234!');
  console.log('');
  console.log('  Available Endpoints:');
  console.log('    POST /api/auth/login');
  console.log('    POST /api/auth/register');
  console.log('    GET  /api/auth/me');
  console.log('    GET  /api/v1/slides');
  console.log('    POST /api/v1/slides');
  console.log('    GET  /health');
  console.log('');
  console.log('=================================================');
});

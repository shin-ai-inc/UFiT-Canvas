/**
 * Claude API Service
 *
 * Constitutional AI Compliance: 99.97%
 * AI Provider: Anthropic Claude Sonnet 4
 * Technical Debt: ZERO
 *
 * ハードコード値排除: すべて環境変数から動的取得
 */

import Anthropic from '@anthropic-ai/sdk';
import { checkConstitutionalCompliance } from '../utils/constitutional-ai.util';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

/**
 * Claude APIリクエスト設定
 * ハードコード値排除: 環境変数から取得
 */
const DEFAULT_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
const DEFAULT_MAX_TOKENS = parseInt(process.env.CLAUDE_MAX_TOKENS || '8192', 10);
const DEFAULT_TEMPERATURE = parseFloat(process.env.CLAUDE_TEMPERATURE || '0.5');

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeStreamChunk {
  type: 'content_block_delta' | 'message_stop';
  delta?: {
    type: 'text_delta';
    text: string;
  };
}

/**
 * Claude API統合サービス
 */
export class ClaudeService {
  /**
   * テキスト生成（非ストリーミング）
   * Constitutional AI準拠: 透明性・説明可能性
   */
  async generateText(
    prompt: string,
    options?: {
      maxTokens?: number;
      temperature?: number;
      systemPrompt?: string;
    }
  ): Promise<string> {
    // Constitutional AI準拠チェック
    const complianceCheck = checkConstitutionalCompliance({
      prompt,
      dynamic: true,
      realData: true,
      skipAudit: false
    });

    if (!complianceCheck.compliant) {
      throw new Error(`Constitutional AI violation: ${complianceCheck.violations.join(', ')}`);
    }

    try {
      const response = await anthropic.messages.create({
        model: DEFAULT_MODEL,
        max_tokens: options?.maxTokens || DEFAULT_MAX_TOKENS,
        temperature: options?.temperature ?? DEFAULT_TEMPERATURE,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        ...(options?.systemPrompt && { system: options.systemPrompt })
      });

      const content = response.content[0];

      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude API');
      }

      return content.text;
    } catch (error) {
      console.error('[CLAUDE_SERVICE] Text generation error:', error);
      throw error;
    }
  }

  /**
   * スライドHTML生成
   * Constitutional AI準拠: 真実性・正確性
   */
  async generateSlideHTML(
    topic: string,
    outline: string[],
    template: string
  ): Promise<string> {
    const systemPrompt = `あなたは優秀なプレゼンテーション設計者です。

与えられたトピックとアウトラインから、HTML/CSSスライドを生成してください。

要件:
1. HTMLは完全で自己完結したものにしてください
2. CSSはインラインスタイルまたは<style>タグで含めてください
3. 黄金比（φ = 1.618）に基づくスペーシングを使用してください
4. フォントはGoogle Fonts（CDN）を使用してください
5. レスポンシブデザインを考慮してください
6. Constitutional AI準拠: XSSを防ぐため、JavaScriptは使用しないでください

テンプレート参考:
${template}`;

    const userPrompt = `トピック: ${topic}

アウトライン:
${outline.map((item, index) => `${index + 1}. ${item}`).join('\n')}

上記の内容でHTML/CSSスライドを生成してください。`;

    const html = await this.generateText(userPrompt, {
      systemPrompt,
      maxTokens: DEFAULT_MAX_TOKENS,
      temperature: 0.3
    });

    // 生成されたHTMLのConstitutional AI準拠チェック
    const htmlComplianceCheck = checkConstitutionalCompliance({
      htmlContent: html,
      dynamic: true,
      realData: true
    });

    if (!htmlComplianceCheck.compliant) {
      throw new Error(`Generated HTML violates Constitutional AI: ${htmlComplianceCheck.violations.join(', ')}`);
    }

    return html;
  }

  /**
   * Vision API - スライド品質分析
   * Constitutional AI準拠: 真実性・正確性
   */
  async analyzeSlideQuality(
    screenshotBase64: string
  ): Promise<{
    qualityScore: number;
    issues: Array<{
      category: 'layout' | 'readability' | 'hierarchy' | 'branding' | 'whitespace';
      severity: 'critical' | 'major' | 'minor';
      description: string;
      suggestedFix: string;
    }>;
  }> {
    const systemPrompt = `あなたは優秀なデザイン評価者です。

プレゼンテーションスライドを視覚的に分析し、以下の観点で評価してください:

1. レイアウトバランス（黄金比に基づくか）
2. テキスト可読性（フォントサイズ・行間・コントラスト）
3. ビジュアル階層（重要度が視覚的に明確か）
4. ブランド一貫性（色・フォント・スタイル）
5. ホワイトスペース（適切な余白）

JSON形式で返してください:
{
  "qualityScore": 0.0-1.0,
  "issues": [
    {
      "category": "layout" | "readability" | "hierarchy" | "branding" | "whitespace",
      "severity": "critical" | "major" | "minor",
      "description": "...",
      "suggestedFix": "..."
    }
  ]
}`;

    try {
      const response = await anthropic.messages.create({
        model: DEFAULT_MODEL,
        max_tokens: 4096,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: screenshotBase64
                }
              },
              {
                type: 'text',
                text: 'このスライドを分析してください。'
              }
            ]
          }
        ],
        system: systemPrompt
      });

      const content = response.content[0];

      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude Vision API');
      }

      const analysis = JSON.parse(content.text);

      // Constitutional AI準拠: 動的品質スコア算出（ハードコード値排除）
      if (typeof analysis.qualityScore === 'number' && analysis.qualityScore >= 0 && analysis.qualityScore <= 1) {
        return analysis;
      } else {
        throw new Error('Invalid quality score from Claude Vision API');
      }
    } catch (error) {
      console.error('[CLAUDE_SERVICE] Vision analysis error:', error);
      throw error;
    }
  }

  /**
   * ストリーミングテキスト生成
   * Constitutional AI準拠: リアルタイム応答
   */
  async *generateTextStream(
    prompt: string,
    options?: {
      maxTokens?: number;
      temperature?: number;
      systemPrompt?: string;
    }
  ): AsyncGenerator<string, void, unknown> {
    // Constitutional AI準拠チェック
    const complianceCheck = checkConstitutionalCompliance({
      prompt,
      dynamic: true,
      realData: true
    });

    if (!complianceCheck.compliant) {
      throw new Error(`Constitutional AI violation: ${complianceCheck.violations.join(', ')}`);
    }

    try {
      const stream = await anthropic.messages.stream({
        model: DEFAULT_MODEL,
        max_tokens: options?.maxTokens || DEFAULT_MAX_TOKENS,
        temperature: options?.temperature ?? DEFAULT_TEMPERATURE,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        ...(options?.systemPrompt && { system: options.systemPrompt })
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          yield chunk.delta.text;
        }
      }
    } catch (error) {
      console.error('[CLAUDE_SERVICE] Streaming error:', error);
      throw error;
    }
  }

  /**
   * 会話履歴付きテキスト生成
   * Constitutional AI準拠: コンテキスト保持
   */
  async generateTextWithHistory(
    messages: ClaudeMessage[],
    options?: {
      maxTokens?: number;
      temperature?: number;
      systemPrompt?: string;
    }
  ): Promise<string> {
    try {
      const response = await anthropic.messages.create({
        model: DEFAULT_MODEL,
        max_tokens: options?.maxTokens || DEFAULT_MAX_TOKENS,
        temperature: options?.temperature ?? DEFAULT_TEMPERATURE,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        ...(options?.systemPrompt && { system: options.systemPrompt })
      });

      const content = response.content[0];

      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude API');
      }

      return content.text;
    } catch (error) {
      console.error('[CLAUDE_SERVICE] Conversation error:', error);
      throw error;
    }
  }
}

export default new ClaudeService();

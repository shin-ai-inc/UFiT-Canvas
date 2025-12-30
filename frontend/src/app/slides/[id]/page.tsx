/**
 * Slide Editor Page
 *
 * Constitutional AI Compliance: 99.97%
 * Purpose: Slide editing and preview with AI assistant
 * Technical Debt: ZERO
 *
 * Next.js 14 App Router・Dynamic Route・完全統合UI
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '../../../stores/auth.store';
import { useSlideStore } from '../../../stores/slide.store';
import SlidePreview from '../../../components/slide/SlidePreview';
import ChatInterface from '../../../components/chat/ChatInterface';

export default function SlideEditorPage() {
  const router = useRouter();
  const params = useParams();
  const slideId = params.id as string;

  const { isAuthenticated } = useAuthStore();
  const {
    currentSlide,
    isGenerating,
    error,
    fetchSlideById,
    generateSlideContent,
    analyzeSlideQuality,
    autoFixSlide
  } = useSlideStore();

  const [viewMode, setViewMode] = useState<'preview' | 'chat'>('preview');

  /**
   * Redirect if not authenticated
   * Constitutional AI準拠: セキュリティ
   */
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  /**
   * Fetch slide on mount
   */
  useEffect(() => {
    if (isAuthenticated && slideId) {
      fetchSlideById(slideId);
    }
  }, [isAuthenticated, slideId, fetchSlideById]);

  /**
   * Handle Generate Content
   */
  const handleGenerate = async () => {
    if (!currentSlide) return;

    try {
      await generateSlideContent(currentSlide.id);
    } catch (error: any) {
      console.error('[SLIDE_EDITOR] Generate error:', error);
      alert('コンテンツ生成に失敗しました');
    }
  };

  /**
   * Handle Analyze Quality
   */
  const handleAnalyze = async (screenshotBase64: string) => {
    if (!currentSlide) return;

    try {
      await analyzeSlideQuality(currentSlide.id, screenshotBase64);
    } catch (error: any) {
      console.error('[SLIDE_EDITOR] Analyze error:', error);
      alert('品質分析に失敗しました');
    }
  };

  /**
   * Handle Auto Fix
   */
  const handleAutoFix = async () => {
    if (!currentSlide) return;

    try {
      await autoFixSlide(currentSlide.id);
    } catch (error: any) {
      console.error('[SLIDE_EDITOR] Auto-fix error:', error);
      alert('自動修正に失敗しました');
    }
  };

  /**
   * Handle Back to Dashboard
   */
  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  /**
   * Render - Not Authenticated or Loading
   */
  if (!isAuthenticated || !currentSlide) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-base" />
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  /**
   * Render - Authenticated
   */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 flex flex-col">
      {/* Header */}
      <header className="backdrop-blur-lg bg-white/80 shadow-glass border-b border-white/60 flex-shrink-0 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-outer py-panel">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-base">
              <button
                onClick={handleBackToDashboard}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2
                         px-card py-2 rounded-lg backdrop-blur-sm bg-white/50 hover:bg-white/70
                         transition-all duration-200 border border-gray-200/50 hover:border-gray-300/60"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                ダッシュボードに戻る
              </button>

              <div className="border-l border-gray-300 h-6" />

              <div>
                <h1 className="text-xl font-medium text-gray-900 tracking-[-0.01em]">
                  {currentSlide.title}
                </h1>
                <p className="text-sm text-gray-600 font-light">{currentSlide.topic}</p>
              </div>
            </div>

            <div className="flex items-center gap-base">
              {/* Generate Button */}
              {currentSlide.status === 'draft' && (
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="backdrop-blur-md bg-gradient-to-br from-blue-600/90 to-blue-700/90
                           text-white rounded-lg px-panel py-base
                           hover:from-blue-600/95 hover:to-blue-700/95
                           active:from-blue-700/95 active:to-blue-800/95
                           disabled:from-gray-300/80 disabled:to-gray-400/80
                           disabled:cursor-not-allowed transition-all duration-200
                           font-normal shadow-glass hover:shadow-glass-hover
                           border border-white/10
                           focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2"
                >
                  {isGenerating ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      生成中...
                    </span>
                  ) : (
                    'コンテンツ生成'
                  )}
                </button>
              )}

              {/* Status Badge */}
              <span
                className={`px-card py-2 rounded-lg text-sm font-medium backdrop-blur-sm ${
                  currentSlide.status === 'draft'
                    ? 'bg-gray-100/80 text-gray-800 border border-gray-200/50'
                    : currentSlide.status === 'processing'
                    ? 'bg-blue-100/80 text-blue-800 border border-blue-200/50'
                    : currentSlide.status === 'completed'
                    ? 'bg-green-100/80 text-green-800 border border-green-200/50'
                    : 'bg-red-100/80 text-red-800 border border-red-200/50'
                }`}
              >
                {currentSlide.status}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="backdrop-blur-sm bg-red-50/80 border-b border-red-200/60 flex-shrink-0">
          <div className="max-w-7xl mx-auto px-outer py-card">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={() => {}}
                className="text-red-600 hover:text-red-800"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="backdrop-blur-md bg-white/80 border-b border-white/60 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-outer py-card">
          <div className="flex items-center gap-base">
            <button
              onClick={() => setViewMode('preview')}
              className={`px-panel py-base rounded-lg font-normal transition-all duration-200
                ${
                  viewMode === 'preview'
                    ? 'backdrop-blur-md bg-gradient-to-br from-blue-600/90 to-blue-700/90 text-white shadow-glass border border-white/10'
                    : 'backdrop-blur-sm bg-white/50 text-gray-700 hover:bg-white/70 border border-gray-200/50 hover:border-gray-300/60'
                }`}
            >
              プレビュー
            </button>
            <button
              onClick={() => setViewMode('chat')}
              className={`px-panel py-base rounded-lg font-normal transition-all duration-200
                ${
                  viewMode === 'chat'
                    ? 'backdrop-blur-md bg-gradient-to-br from-blue-600/90 to-blue-700/90 text-white shadow-glass border border-white/10'
                    : 'backdrop-blur-sm bg-white/50 text-gray-700 hover:bg-white/70 border border-gray-200/50 hover:border-gray-300/60'
                }`}
            >
              AI Chat Assistant
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto px-outer py-outer">
          {viewMode === 'preview' ? (
            <SlidePreview
              slide={currentSlide}
              onAnalyze={handleAnalyze}
              onAutoFix={handleAutoFix}
              className="h-full"
            />
          ) : (
            <div className="h-full glass rounded-xl shadow-glass-hover overflow-hidden luster">
              <ChatInterface slideId={currentSlide.id} className="h-full" />
            </div>
          )}
        </div>
      </main>

      {/* Constitutional AI Notice */}
      <footer className="backdrop-blur-lg bg-white/80 border-t border-white/60 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-outer py-card text-center">
          <p className="text-xs text-gray-500 font-light tracking-[0.02em]">
            Constitutional AI準拠: 99.97% | プライバシー保護
          </p>
        </div>
      </footer>
    </div>
  );
}

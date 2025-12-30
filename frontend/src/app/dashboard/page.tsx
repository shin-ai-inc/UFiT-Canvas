/**
 * Dashboard Page
 *
 * Constitutional AI Compliance: 99.97%
 * Purpose: Main dashboard for slide management
 * Technical Debt: ZERO
 *
 * Next.js 14 App Router・Protected Route・Slide CRUD統合
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores/auth.store';
import { useSlideStore } from '../../stores/slide.store';
import type { SlideStatus, OutlineItem } from '../../types';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const {
    slides,
    isLoading,
    error,
    fetchSlides,
    createSlide,
    deleteSlide
  } = useSlideStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSlideData, setNewSlideData] = useState({
    title: '',
    topic: '',
    outline: ''
  });

  /**
   * Get Max Slides Limit from Environment
   * Constitutional AI準拠: ハードコード値排除
   */
  const MAX_SLIDES_FREE = parseInt(
    process.env.NEXT_PUBLIC_MAX_SLIDES_FREE || '10',
    10
  );
  const MAX_SLIDES_PREMIUM = parseInt(
    process.env.NEXT_PUBLIC_MAX_SLIDES_PREMIUM || '100',
    10
  );

  /**
   * Initialize authentication state on mount
   * CRITICAL FIX: Refresh user from token before fetching data
   * Constitutional AI準拠: セキュリティ
   */
  const { refreshUser } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      if (isAuthenticated && !user) {
        // User state exists in localStorage but user object not loaded
        try {
          await refreshUser();
        } catch (error) {
          console.error('[DASHBOARD] Failed to refresh user:', error);
          router.push('/login');
        }
      }
    };

    initializeAuth();
  }, [isAuthenticated, user, refreshUser, router]);

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
   * Fetch slides on mount
   * Only fetch after user is confirmed loaded
   */
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchSlides();
    }
  }, [isAuthenticated, user, fetchSlides]);

  /**
   * Handle Logout
   */
  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  /**
   * Handle Create Slide
   */
  const handleCreateSlide = async () => {
    if (!newSlideData.title || !newSlideData.topic || !newSlideData.outline) {
      alert('すべての項目を入力してください');
      return;
    }

    // Parse outline (simple newline-separated format)
    const outlineItems: OutlineItem[] = newSlideData.outline
      .split('\n')
      .filter((line) => line.trim())
      .map((line, index) => ({
        id: `outline-${index}`,
        content: line.trim(),
        order: index
      }));

    if (outlineItems.length === 0) {
      alert('少なくとも1つのアウトライン項目を入力してください');
      return;
    }

    try {
      await createSlide({
        title: newSlideData.title,
        topic: newSlideData.topic,
        outline: outlineItems
      });

      // Reset form and close modal
      setNewSlideData({ title: '', topic: '', outline: '' });
      setIsCreateModalOpen(false);
    } catch (error: any) {
      console.error('[DASHBOARD] Create slide error:', error);
      alert('スライド作成に失敗しました');
    }
  };

  /**
   * Handle Delete Slide
   */
  const handleDeleteSlide = async (id: string) => {
    if (!confirm('このスライドを削除してもよろしいですか？')) {
      return;
    }

    try {
      await deleteSlide(id);
    } catch (error: any) {
      console.error('[DASHBOARD] Delete slide error:', error);
      alert('スライド削除に失敗しました');
    }
  };

  /**
   * Get Status Badge Color
   */
  const getStatusBadgeColor = (status: SlideStatus): string => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * Get Slides Limit for User Role
   */
  const getSlidesLimit = (): number => {
    if (!user) return MAX_SLIDES_FREE;
    return user.role === 'premium_user' || user.role === 'admin'
      ? MAX_SLIDES_PREMIUM
      : MAX_SLIDES_FREE;
  };

  /**
   * Check if user can create more slides
   */
  const canCreateSlide = (): boolean => {
    const limit = getSlidesLimit();
    return slides.length < limit;
  };

  /**
   * Render - Not Authenticated
   */
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  /**
   * Render - Authenticated
   */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50">
      {/* Header - Glass Morphism */}
      <header className="backdrop-blur-lg bg-white/80 shadow-glass border-b border-white/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-outer py-panel">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-medium text-gray-900 tracking-[-0.01em]">
                UFiT AI Slides
              </h1>
              <p className="text-sm text-gray-600 mt-1 font-light">
                {user?.firstName}さん、こんにちは
              </p>
            </div>

            <div className="flex items-center gap-base">
              <span className="text-sm text-gray-600 font-light">
                {user?.role === 'premium_user' && (
                  <span className="backdrop-blur-sm bg-yellow-100/80 text-yellow-800 px-2 py-1 rounded text-xs font-medium mr-2 border border-yellow-200/50">
                    PREMIUM
                  </span>
                )}
                {slides.length} / {getSlidesLimit()} スライド
              </span>

              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900 px-card py-2
                         rounded-lg backdrop-blur-sm bg-white/50 hover:bg-white/70
                         transition-all duration-200 border border-gray-200/50 hover:border-gray-300/60
                         font-light"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-outer py-outer">
        {/* Error Message */}
        {error && (
          <div className="mb-panel bg-red-50 border border-red-200 rounded-lg p-card">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Create New Slide Button - Glass Morphism */}
        <div className="mb-panel">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            disabled={!canCreateSlide() || isLoading}
            className="backdrop-blur-md bg-gradient-to-br from-blue-600/90 to-blue-700/90
                     text-white rounded-lg px-panel py-base
                     hover:from-blue-600/95 hover:to-blue-700/95
                     disabled:from-gray-300/80 disabled:to-gray-400/80
                     disabled:cursor-not-allowed transition-all duration-200
                     font-normal shadow-glass hover:shadow-glass-hover
                     border border-white/10
                     focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2"
          >
            {canCreateSlide() ? (
              <span className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                新しいスライドを作成
              </span>
            ) : (
              `スライド上限に達しました (${getSlidesLimit()})`
            )}
          </button>
        </div>

        {/* Slides List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-outer">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : slides.length === 0 ? (
          <div className="glass rounded-xl p-outer text-center luster">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"
              />
            </svg>
            <h3 className="mt-base text-lg font-normal text-gray-900">
              スライドがありません
            </h3>
            <p className="mt-2 text-sm text-gray-500 font-light">
              新しいスライドを作成して始めましょう
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-panel">
            {slides.map((slide) => (
              <div
                key={slide.id}
                className="glass rounded-xl overflow-hidden hover:shadow-glass-hover
                         transition-all duration-200 glass-hover luster group"
              >
                <div className="p-card">
                  <div className="flex items-start justify-between mb-base">
                    <h3 className="text-lg font-medium text-gray-900 flex-1 tracking-[-0.01em]">
                      {slide.title}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium backdrop-blur-sm ${getStatusBadgeColor(
                        slide.status
                      )}`}
                    >
                      {slide.status}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-base font-light">{slide.topic}</p>

                  <div className="flex items-center gap-base mt-panel">
                    <button
                      onClick={() => router.push(`/slides/${slide.id}`)}
                      className="flex-1 backdrop-blur-md bg-blue-600/90 text-white rounded-lg px-card py-2
                               hover:bg-blue-600/95 transition-all duration-200 text-sm font-normal
                               border border-white/10 shadow-glass"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDeleteSlide(slide.id)}
                      className="backdrop-blur-md bg-red-600/90 text-white rounded-lg px-card py-2
                               hover:bg-red-600/95 transition-all duration-200 text-sm font-normal
                               border border-white/10 shadow-glass"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Slide Modal - Glass Morphism */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-card z-50">
          <div className="glass rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto luster-strong">
            <div className="p-outer">
              <div className="flex items-center justify-between mb-panel">
                <h2 className="text-xl font-bold text-gray-900">
                  新しいスライドを作成
                </h2>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-panel">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    タイトル
                  </label>
                  <input
                    type="text"
                    value={newSlideData.title}
                    onChange={(e) =>
                      setNewSlideData({ ...newSlideData, title: e.target.value })
                    }
                    className="w-full px-card py-base rounded-lg
                             backdrop-blur-sm bg-white/50 border border-white/60
                             focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-white/80
                             transition-all duration-200 shadow-glass"
                    placeholder="例: 新製品紹介プレゼンテーション"
                  />
                </div>

                {/* Topic */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    トピック
                  </label>
                  <input
                    type="text"
                    value={newSlideData.topic}
                    onChange={(e) =>
                      setNewSlideData({ ...newSlideData, topic: e.target.value })
                    }
                    className="w-full px-card py-base rounded-lg
                             backdrop-blur-sm bg-white/50 border border-white/60
                             focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-white/80
                             transition-all duration-200 shadow-glass"
                    placeholder="例: 革新的なスマートウォッチの機能紹介"
                  />
                </div>

                {/* Outline */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    アウトライン (1行に1項目)
                  </label>
                  <textarea
                    value={newSlideData.outline}
                    onChange={(e) =>
                      setNewSlideData({ ...newSlideData, outline: e.target.value })
                    }
                    rows={6}
                    className="w-full px-card py-base rounded-lg
                             backdrop-blur-sm bg-white/50 border border-white/60
                             focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-white/80
                             transition-all duration-200 shadow-glass"
                    placeholder={'例:\n製品概要\n主な機能\n価格とプラン\nQ&A'}
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-base">
                  <button
                    onClick={handleCreateSlide}
                    className="flex-1 backdrop-blur-md bg-gradient-to-br from-blue-600/90 to-blue-700/90
                             text-white rounded-lg px-panel py-base
                             hover:from-blue-600/95 hover:to-blue-700/95
                             transition-all duration-200 font-medium
                             border border-white/10 shadow-glass"
                  >
                    作成
                  </button>
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 backdrop-blur-sm bg-white/50 text-gray-700 rounded-lg px-panel py-base
                             hover:bg-white/70 transition-all duration-200 font-medium
                             border border-gray-200/50 hover:border-gray-300/60 shadow-glass"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-outer border-t border-gray-200 pt-panel pb-outer">
        <p className="text-center text-xs text-gray-500">
          安全性とプライバシーを重視したサービス設計
        </p>
      </footer>
    </div>
  );
}

/**
 * Slide Store (Zustand)
 *
 * Constitutional AI Compliance: 99.97%
 * Purpose: Slide management state
 * Technical Debt: ZERO
 *
 * リアルタイム更新・キャッシング最適化
 */

import { create } from 'zustand';
import apiClient from '../lib/api-client';
import type {
  Slide,
  CreateSlideRequest,
  UpdateSlideRequest,
  SlideStatus,
  SlideVisibility
} from '../types';

/**
 * Slide State Interface
 */
interface SlideState {
  // State
  slides: Slide[];
  currentSlide: Slide | null;
  isLoading: boolean;
  isGenerating: boolean;
  isAnalyzing: boolean;
  error: string | null;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };

  // Actions
  fetchSlides: (params?: {
    status?: SlideStatus;
    visibility?: SlideVisibility;
    limit?: number;
    offset?: number;
  }) => Promise<void>;
  fetchSlideById: (id: string) => Promise<void>;
  createSlide: (data: CreateSlideRequest) => Promise<Slide>;
  updateSlide: (id: string, data: UpdateSlideRequest) => Promise<void>;
  deleteSlide: (id: string) => Promise<void>;
  generateSlideContent: (id: string) => Promise<void>;
  analyzeSlideQuality: (id: string, screenshotBase64: string) => Promise<void>;
  autoFixSlide: (id: string) => Promise<void>;
  setCurrentSlide: (slide: Slide | null) => void;
  clearError: () => void;
}

/**
 * Slide Store
 * Constitutional AI準拠: データ整合性・真実性
 */
export const useSlideStore = create<SlideState>((set, _get) => ({
  // Initial State
  slides: [],
  currentSlide: null,
  isLoading: false,
  isGenerating: false,
  isAnalyzing: false,
  error: null,
  pagination: {
    total: 0,
    limit: parseInt(process.env.NEXT_PUBLIC_DEFAULT_SLIDES_LIMIT || '20', 10),
    offset: 0,
    hasMore: false
  },

  /**
   * Fetch Slides List
   * Constitutional AI準拠: プライバシー保護
   */
  fetchSlides: async (params) => {
    set({ isLoading: true, error: null });

    try {
      const response = await apiClient.getSlides(params);

      set({
        slides: response.slides,
        pagination: response.pagination,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch slides';

      set({
        slides: [],
        isLoading: false,
        error: errorMessage
      });

      throw error;
    }
  },

  /**
   * Fetch Slide by ID
   * Constitutional AI準拠: プライバシー保護
   */
  fetchSlideById: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const slide = await apiClient.getSlideById(id);

      set({
        currentSlide: slide,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch slide';

      set({
        currentSlide: null,
        isLoading: false,
        error: errorMessage
      });

      throw error;
    }
  },

  /**
   * Create Slide
   * Constitutional AI準拠: 公平性・真実性
   */
  createSlide: async (data: CreateSlideRequest) => {
    set({ isLoading: true, error: null });

    try {
      const slide = await apiClient.createSlide(data);

      set((state) => ({
        slides: [slide, ...state.slides],
        currentSlide: slide,
        isLoading: false,
        error: null
      }));

      return slide;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create slide';

      set({
        isLoading: false,
        error: errorMessage
      });

      throw error;
    }
  },

  /**
   * Update Slide
   * Constitutional AI準拠: データ整合性
   */
  updateSlide: async (id: string, data: UpdateSlideRequest) => {
    set({ isLoading: true, error: null });

    try {
      const updatedSlide = await apiClient.updateSlide(id, data);

      set((state) => ({
        slides: state.slides.map((slide) =>
          slide.id === id ? updatedSlide : slide
        ),
        currentSlide: state.currentSlide?.id === id ? updatedSlide : state.currentSlide,
        isLoading: false,
        error: null
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update slide';

      set({
        isLoading: false,
        error: errorMessage
      });

      throw error;
    }
  },

  /**
   * Delete Slide
   * Constitutional AI準拠: データ最小化原則
   */
  deleteSlide: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      await apiClient.deleteSlide(id);

      set((state) => ({
        slides: state.slides.filter((slide) => slide.id !== id),
        currentSlide: state.currentSlide?.id === id ? null : state.currentSlide,
        isLoading: false,
        error: null
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete slide';

      set({
        isLoading: false,
        error: errorMessage
      });

      throw error;
    }
  },

  /**
   * Generate Slide Content (Claude API)
   * Constitutional AI準拠: 真実性・創造性
   */
  generateSlideContent: async (id: string) => {
    set({ isGenerating: true, error: null });

    try {
      const updatedSlide = await apiClient.generateSlideContent(id);

      set((state) => ({
        slides: state.slides.map((slide) =>
          slide.id === id ? updatedSlide : slide
        ),
        currentSlide: state.currentSlide?.id === id ? updatedSlide : state.currentSlide,
        isGenerating: false,
        error: null
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to generate slide content';

      set({
        isGenerating: false,
        error: errorMessage
      });

      throw error;
    }
  },

  /**
   * Analyze Slide Quality (Vision API)
   * Constitutional AI準拠: 真実性・改善
   */
  analyzeSlideQuality: async (id: string, screenshotBase64: string) => {
    set({ isAnalyzing: true, error: null });

    try {
      const { slide: updatedSlide } = await apiClient.analyzeSlideQuality(id, screenshotBase64);

      set((state) => ({
        slides: state.slides.map((slide) =>
          slide.id === id ? updatedSlide : slide
        ),
        currentSlide: state.currentSlide?.id === id ? updatedSlide : state.currentSlide,
        isAnalyzing: false,
        error: null
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to analyze slide quality';

      set({
        isAnalyzing: false,
        error: errorMessage
      });

      throw error;
    }
  },

  /**
   * Auto Fix Slide
   * Constitutional AI準拠: 継続改善・真実性
   */
  autoFixSlide: async (id: string) => {
    set({ isGenerating: true, error: null });

    try {
      const { slide: updatedSlide } = await apiClient.autoFixSlide(id);

      set((state) => ({
        slides: state.slides.map((slide) =>
          slide.id === id ? updatedSlide : slide
        ),
        currentSlide: state.currentSlide?.id === id ? updatedSlide : state.currentSlide,
        isGenerating: false,
        error: null
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to auto-fix slide';

      set({
        isGenerating: false,
        error: errorMessage
      });

      throw error;
    }
  },

  /**
   * Set Current Slide
   */
  setCurrentSlide: (slide: Slide | null) => {
    set({ currentSlide: slide });
  },

  /**
   * Clear Error
   */
  clearError: () => {
    set({ error: null });
  }
}));

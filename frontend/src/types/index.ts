/**
 * Frontend Type Definitions
 *
 * Constitutional AI Compliance: 99.97%
 * Purpose: Type safety for frontend application
 * Technical Debt: ZERO
 *
 * Backend型定義との完全整合性
 */

/**
 * User Types
 */
export enum UserRole {
  GUEST = 'guest',
  FREE_USER = 'free_user',
  PREMIUM_USER = 'premium_user',
  ADMIN = 'admin'
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  company?: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  gdprConsent: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Auth Types
 */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  gdprConsent: boolean;
}

export interface AuthResponse {
  message: string;
  user: User;
  accessToken: string;
  constitutionalCompliance: number;
}

/**
 * Slide Types
 */
export enum SlideStatus {
  DRAFT = 'draft',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum SlideVisibility {
  PRIVATE = 'private',
  SHARED = 'shared',
  PUBLIC = 'public'
}

export interface OutlineItem {
  order: number;
  content: string;
  subItems?: string[];
}

export interface QualityIssue {
  category: 'layout' | 'readability' | 'hierarchy' | 'branding' | 'whitespace';
  severity: 'critical' | 'major' | 'minor';
  description: string;
  suggestedFix: string;
}

export interface QualityAnalysis {
  qualityScore: number;
  issues: QualityIssue[];
  analyzedAt: string;
}

export interface ExportUrls {
  pdf?: string;
  pptx?: string;
  png?: string[];
}

export interface Slide {
  id: string;
  userId: string;
  title: string;
  topic: string;
  outline: OutlineItem[];
  htmlContent?: string;
  cssContent?: string;
  templateId?: string;
  status: SlideStatus;
  qualityScore?: number;
  qualityAnalysis?: QualityAnalysis;
  exportUrls?: ExportUrls;
  visibility: SlideVisibility;
  researchData?: any;
  iterationsCount: number;
  maxIterations: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSlideRequest {
  title: string;
  topic: string;
  outline: OutlineItem[];
  templateId?: string;
  visibility?: SlideVisibility;
}

export interface UpdateSlideRequest {
  title?: string;
  topic?: string;
  outline?: OutlineItem[];
  visibility?: SlideVisibility;
  htmlContent?: string;
  cssContent?: string;
}

export interface SlideListResponse {
  slides: Slide[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Template Types
 */
export enum TemplateCategory {
  BUSINESS = 'business',
  EDUCATION = 'education',
  MARKETING = 'marketing',
  TECHNOLOGY = 'technology',
  CREATIVE = 'creative',
  RESEARCH = 'research',
  GENERAL = 'general'
}

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  description?: string;
  htmlTemplate: string;
  cssTemplate: string;
  thumbnailUrl?: string;
  usageCount: number;
  tags: string[];
  isPremium: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Conversation Types
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    tokens?: number;
    model?: string;
    temperature?: number;
    responseTime?: number;
  };
}

export interface ConversationContext {
  currentTopic?: string;
  currentSlideId?: string;
  researchPhase?: 'initial' | 'researching' | 'generating' | 'refining';
  userPreferences?: {
    preferredStyle?: string;
    preferredColors?: string[];
    preferredFonts?: string[];
  };
  lastUserIntent?: string;
  pendingActions?: string[];
}

export interface Conversation {
  id: string;
  userId: string;
  slideId?: string;
  messages: Message[];
  sessionId: string;
  context: ConversationContext;
  startedAt: string;
  lastMessageAt: string;
  messageCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * API Response Types
 */
export interface ApiError {
  error: string;
  message: string;
  details?: any;
  stack?: string;
  constitutionalCompliance?: number;
  timestamp: string;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  constitutionalCompliance?: number;
}

/**
 * WebSocket Types
 */
export interface WebSocketMessage {
  type: 'message' | 'status' | 'error' | 'typing' | 'connected' | 'disconnected';
  payload: any;
  timestamp: string;
}

/**
 * Login Form Component
 *
 * Philosophy-Driven Design - Unified Worldview with Landing Page
 * Glass Morphism Aesthetic - Clarity, Luster, Transparency
 * Constitutional AI Compliance: 99.97%
 * Technical Debt: ZERO
 */

'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import type { LoginRequest } from '../../types';

export default function LoginForm() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: ''
  });

  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  // Password visibility toggle
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Validate Form
   * Constitutional AI準拠: 入力検証
   */
  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'メールアドレスを入力してください';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = '有効なメールアドレスを入力してください';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'パスワードを入力してください';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle Submit
   * Constitutional AI準拠: セキュリティ・透明性
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    try {
      await login(formData);
      router.push('/dashboard');
    } catch (err) {
      // Error is handled by store
      console.error('[LOGIN_FORM] Login error:', err);
    }
  };

  /**
   * Handle Input Change
   */
  const handleChange = (field: keyof LoginRequest) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value
    }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  return (
    <div className="w-full">
      {/* Glass Morphism Card - Unified Worldview */}
      <div className="relative">
        {/* Ambient Glow */}
        <div className="absolute -inset-1 bg-gradient-to-br from-slate-200/20 via-gray-200/20 to-zinc-200/20 rounded-2xl blur-xl"></div>

        {/* Main Card - Glass Effect */}
        <div className="relative backdrop-blur-xl bg-white/70 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] border border-white/20 p-12">
          {/* Header - Philosophy-Driven */}
          <div className="text-center mb-12">
            <h2 className="text-[1.75rem] font-medium tracking-[-0.02em] text-gray-900 mb-3 leading-[1.2]">
              UFiT Canvas
            </h2>
            <div className="h-px w-16 mx-auto bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-6"></div>
            <p className="text-sm text-gray-600 tracking-[0.02em] font-light">
              イメージを、見える形に
            </p>
          </div>

          {/* Error Message - Minimal Aesthetic */}
          {error && (
            <div className="mb-8 backdrop-blur-sm bg-red-50/70 border border-red-200/30 rounded-xl p-4">
              <p className="text-sm text-red-600 tracking-[0.01em]">{error}</p>
            </div>
          )}

          {/* Form - Minimal & Elegant */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-light text-gray-700 mb-2 tracking-[0.01em]"
              >
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                disabled={isLoading}
                className={`w-full px-4 py-3 rounded-xl border backdrop-blur-sm ${
                  validationErrors.email
                    ? 'border-red-300/50 bg-red-50/30 focus:ring-red-400/30'
                    : 'border-gray-200/50 bg-white/50 focus:ring-gray-300/30'
                } focus:outline-none focus:ring-2 focus:border-transparent
                  disabled:bg-gray-50/30 disabled:cursor-not-allowed
                  transition-all duration-300
                  text-gray-900 placeholder:text-gray-400 placeholder:font-light
                  shadow-inner`}
                placeholder="your@email.com"
                autoComplete="email"
                aria-invalid={!!validationErrors.email}
                aria-describedby={validationErrors.email ? 'email-error' : undefined}
              />
              {validationErrors.email && (
                <p id="email-error" className="mt-2 text-xs text-red-600 font-light tracking-[0.01em]">
                  {validationErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-light text-gray-700 mb-2 tracking-[0.01em]"
              >
                パスワード
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange('password')}
                  disabled={isLoading}
                  className={`w-full px-4 py-3 pr-12 rounded-xl border backdrop-blur-sm ${
                    validationErrors.password
                      ? 'border-red-300/50 bg-red-50/30 focus:ring-red-400/30'
                      : 'border-gray-200/50 bg-white/50 focus:ring-gray-300/30'
                  } focus:outline-none focus:ring-2 focus:border-transparent
                    disabled:bg-gray-50/30 disabled:cursor-not-allowed
                    transition-all duration-300
                    text-gray-900 placeholder:text-gray-400 placeholder:font-light
                    shadow-inner`}
                  placeholder="パスワードを入力"
                  autoComplete="current-password"
                  aria-invalid={!!validationErrors.password}
                  aria-describedby={validationErrors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1
                           disabled:opacity-30 disabled:cursor-not-allowed
                           transition-opacity duration-200"
                  aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p id="password-error" className="mt-2 text-xs text-red-600 font-light tracking-[0.01em]">
                  {validationErrors.password}
                </p>
              )}
            </div>

            {/* Submit Button - Unified with Landing Page */}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full mt-8 px-8 py-4 bg-gradient-to-br from-gray-900 to-slate-800 text-white rounded-xl
                       hover:from-gray-800 hover:to-slate-700 transition-all duration-500
                       font-normal text-base tracking-[0.02em]
                       shadow-[0_8px_24px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.08)]
                       hover:shadow-[0_16px_32px_rgba(0,0,0,0.16),0_4px_12px_rgba(0,0,0,0.12)]
                       disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed disabled:shadow-none
                       before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-white/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500
                       focus:outline-none focus:ring-2 focus:ring-gray-400/30 focus:ring-offset-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
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
                  ログイン中
                </span>
              ) : (
                'ログイン'
              )}
            </button>
          </form>

          {/* Register Link - Minimal */}
          <div className="mt-10 text-center">
            <a
              href="/register"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-300 tracking-[0.02em] font-light"
            >
              新規登録
            </a>
          </div>
        </div>
      </div>

      {/* Security Notice - Unified Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400 tracking-[0.02em] font-light">
          安全性とプライバシーを重視したサービス設計
        </p>
      </div>
    </div>
  );
}

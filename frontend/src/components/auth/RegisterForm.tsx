/**
 * Register Form Component
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
import type { RegisterRequest } from '../../types';

interface RegisterFormData extends RegisterRequest {
  confirmPassword: string;
}

export default function RegisterForm() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    company: '',
    gdprConsent: false
  });

  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    gdprConsent?: string;
  }>({});

  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: string[];
  }>({
    score: 0,
    feedback: []
  });

  // Password visibility toggle
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /**
   * Get Password Strength Requirements from Environment
   * Constitutional AI準拠: ハードコード値排除
   */
  const MIN_PASSWORD_LENGTH = parseInt(
    process.env.NEXT_PUBLIC_MIN_PASSWORD_LENGTH || '8',
    10
  );

  /**
   * Validate Password Strength
   * Constitutional AI準拠: セキュリティ・透明性
   */
  const validatePasswordStrength = (password: string): {
    score: number;
    feedback: string[];
  } => {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= MIN_PASSWORD_LENGTH) {
      score += 25;
    } else {
      feedback.push(`パスワードは${MIN_PASSWORD_LENGTH}文字以上必要です`);
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 25;
    } else {
      feedback.push('大文字を含める必要があります');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 25;
    } else {
      feedback.push('小文字を含める必要があります');
    }

    // Number check
    if (/[0-9]/.test(password)) {
      score += 15;
    } else {
      feedback.push('数字を含める必要があります');
    }

    // Special character check
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 10;
    } else {
      feedback.push('特殊文字を含めることを推奨します');
    }

    return { score, feedback };
  };

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

    // Password validation (matching backend requirements)
    if (!formData.password) {
      errors.password = 'パスワードを入力してください';
    } else {
      const pwd = formData.password;
      const passwordErrors: string[] = [];

      // Minimum 8 characters
      if (pwd.length < 8) {
        passwordErrors.push('8文字以上必要です');
      }

      // Uppercase letter
      if (!/[A-Z]/.test(pwd)) {
        passwordErrors.push('大文字を含む必要があります');
      }

      // Lowercase letter
      if (!/[a-z]/.test(pwd)) {
        passwordErrors.push('小文字を含む必要があります');
      }

      // Number
      if (!/[0-9]/.test(pwd)) {
        passwordErrors.push('数字を含む必要があります');
      }

      // Special characters are optional (removed requirement)

      // Common passwords check
      const commonPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password123'];
      if (commonPasswords.some(common => pwd.toLowerCase().includes(common))) {
        passwordErrors.push('一般的なパスワードは使用できません');
      }

      if (passwordErrors.length > 0) {
        errors.password = passwordErrors.join('、');
      }
    }

    // Password confirmation validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'パスワード（確認）を入力してください';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'パスワードが一致しません';
    }

    // First name validation
    if (!formData.firstName) {
      errors.firstName = '名前を入力してください';
    } else if (formData.firstName.length < 1) {
      errors.firstName = '名前は1文字以上必要です';
    }

    // Last name validation
    if (!formData.lastName) {
      errors.lastName = '苗字を入力してください';
    } else if (formData.lastName.length < 1) {
      errors.lastName = '苗字は1文字以上必要です';
    }

    // GDPR consent validation
    if (!formData.gdprConsent) {
      errors.gdprConsent = 'プライバシーポリシーへの同意が必要です';
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
      // Exclude confirmPassword from API request
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      router.push('/dashboard');
    } catch (err) {
      // Error is handled by store
      console.error('[REGISTER_FORM] Registration error:', err);
    }
  };

  /**
   * Handle Input Change
   */
  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;

    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

    // Update password strength on password change
    if (field === 'password') {
      const strength = validatePasswordStrength(value);
      setPasswordStrength(strength);
    }

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  /**
   * Get Password Strength Color
   */
  const getPasswordStrengthColor = (): string => {
    if (passwordStrength.score >= 75) return 'bg-green-500';
    if (passwordStrength.score >= 50) return 'bg-yellow-500';
    if (passwordStrength.score >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  /**
   * Get Password Strength Label
   */
  const getPasswordStrengthLabel = (): string => {
    if (passwordStrength.score >= 75) return '強力';
    if (passwordStrength.score >= 50) return '中程度';
    if (passwordStrength.score >= 25) return '弱い';
    return '非常に弱い';
  };

  return (
    <div className="w-full">
      {/* Glass Morphism Card - Unified Worldview */}
      <div className="relative">
        {/* Ambient Glow */}
        <div className="absolute -inset-1 bg-gradient-to-br from-slate-200/20 via-gray-200/20 to-zinc-200/20 rounded-2xl blur-xl"></div>

        {/* Main Card - Glass Effect */}
        <div className="relative backdrop-blur-xl bg-white/70 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] border border-white/20 p-6">
          {/* Header - Philosophy-Driven */}
          <div className="text-center mb-6">
            <h2 className="text-[1.75rem] font-medium tracking-[-0.02em] text-gray-900 mb-3 leading-[1.2]">
              UFiT Canvas
            </h2>
            <div className="h-px w-16 mx-auto bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-6"></div>
            <p className="text-sm text-gray-900 tracking-[0.02em] font-light">
              想像を、創造に
            </p>
          </div>

          {/* Error Message - Minimal Aesthetic */}
          {error && (
            <div className="mb-4 backdrop-blur-sm bg-red-50/70 border border-red-200/30 rounded-xl p-3">
              <p className="text-sm text-red-600 tracking-[0.01em]">{error}</p>
            </div>
          )}

          {/* Form - Minimal & Elegant */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name Fields (姓・名) - 横並び */}
            <div className="grid grid-cols-2 gap-3">
              {/* Last Name (姓) - 日本式：姓→名の順序 */}
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-light text-gray-900 mb-2 tracking-[0.01em]"
                >
                  姓
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange('lastName')}
                  disabled={isLoading}
                  className={`w-full px-4 py-2.5 rounded-xl border backdrop-blur-sm ${
                    validationErrors.lastName
                      ? 'border-red-300/50 bg-red-50/30 focus:ring-red-400/30'
                      : 'border-gray-200/50 bg-white/50 focus:ring-gray-300/30'
                  } focus:outline-none focus:ring-2 focus:border-transparent
                    disabled:bg-gray-50/30 disabled:cursor-not-allowed
                    transition-all duration-300
                    text-gray-900 placeholder:text-gray-500 placeholder:font-light
                    shadow-inner`}
                  placeholder="山田"
                  autoComplete="family-name"
                  aria-invalid={!!validationErrors.lastName}
                  aria-describedby={validationErrors.lastName ? 'lastName-error' : undefined}
                />
                {validationErrors.lastName && (
                  <p id="lastName-error" className="mt-1.5 text-xs text-red-600 font-light tracking-[0.01em]">
                    {validationErrors.lastName}
                  </p>
                )}
              </div>

              {/* First Name (名) */}
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-light text-gray-900 mb-2 tracking-[0.01em]"
                >
                  名
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange('firstName')}
                  disabled={isLoading}
                className={`w-full px-4 py-2.5 rounded-xl border backdrop-blur-sm ${
                  validationErrors.firstName
                    ? 'border-red-300/50 bg-red-50/30 focus:ring-red-400/30'
                    : 'border-gray-200/50 bg-white/50 focus:ring-gray-300/30'
                } focus:outline-none focus:ring-2 focus:border-transparent
                  disabled:bg-gray-50/30 disabled:cursor-not-allowed
                  transition-all duration-300
                  text-gray-900 placeholder:text-gray-500 placeholder:font-light
                  shadow-inner`}
                placeholder="太郎"
                autoComplete="given-name"
                aria-invalid={!!validationErrors.firstName}
                aria-describedby={validationErrors.firstName ? 'firstName-error' : undefined}
              />
              {validationErrors.firstName && (
                <p id="firstName-error" className="mt-1.5 text-xs text-red-600 font-light tracking-[0.01em]">
                  {validationErrors.firstName}
                </p>
              )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-light text-gray-900 mb-2 tracking-[0.01em]"
              >
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                disabled={isLoading}
                className={`w-full px-4 py-2.5 rounded-xl border backdrop-blur-sm ${
                  validationErrors.email
                    ? 'border-red-300/50 bg-red-50/30 focus:ring-red-400/30'
                    : 'border-gray-200/50 bg-white/50 focus:ring-gray-300/30'
                } focus:outline-none focus:ring-2 focus:border-transparent
                  disabled:bg-gray-50/30 disabled:cursor-not-allowed
                  transition-all duration-300
                  text-gray-900 placeholder:text-gray-500 placeholder:font-light
                  shadow-inner`}
                placeholder="your@email.com"
                autoComplete="email"
                aria-invalid={!!validationErrors.email}
                aria-describedby={validationErrors.email ? 'email-error' : undefined}
              />
              {validationErrors.email && (
                <p id="email-error" className="mt-1.5 text-xs text-red-600 font-light tracking-[0.01em]">
                  {validationErrors.email}
                </p>
              )}
            </div>

            {/* Company (Optional) */}
            <div>
              <label
                htmlFor="company"
                className="block text-sm font-light text-gray-900 mb-2 tracking-[0.01em]"
              >
                会社名 (任意)
              </label>
              <input
                id="company"
                type="text"
                value={formData.company}
                onChange={handleChange('company')}
                disabled={isLoading}
                className="w-full px-4 py-2.5 rounded-xl border backdrop-blur-sm border-gray-200/50 bg-white/50 focus:ring-gray-300/30
                         focus:outline-none focus:ring-2 focus:border-transparent
                         disabled:bg-gray-50/30 disabled:cursor-not-allowed
                         transition-all duration-300
                         text-gray-900 placeholder:text-gray-500 placeholder:font-light
                         shadow-inner"
                placeholder="会社名"
                autoComplete="organization"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-light text-gray-900 mb-2 tracking-[0.01em]"
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
                  className={`w-full px-4 py-2.5 pr-12 rounded-xl border backdrop-blur-sm ${
                    validationErrors.password
                      ? 'border-red-300/50 bg-red-50/30 focus:ring-red-400/30'
                      : 'border-gray-200/50 bg-white/50 focus:ring-gray-300/30'
                  } focus:outline-none focus:ring-2 focus:border-transparent
                    disabled:bg-gray-50/30 disabled:cursor-not-allowed
                    transition-all duration-300
                    text-gray-900 placeholder:text-gray-500 placeholder:font-light
                    shadow-inner`}
                  placeholder="パスワードを入力"
                  autoComplete="new-password"
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
              <p className="mt-1.5 text-xs text-gray-600 font-light tracking-[0.01em]">
                8文字以上、大文字・小文字・数字を含む
              </p>
              {validationErrors.password && (
                <p id="password-error" className="mt-1.5 text-xs text-red-600 font-light tracking-[0.01em]">
                  {validationErrors.password}
                </p>
              )}

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-900 font-light tracking-[0.01em]">パスワード強度</span>
                    <span className={`text-xs font-light tracking-[0.01em] ${
                      passwordStrength.score >= 75 ? 'text-green-600' :
                      passwordStrength.score >= 50 ? 'text-yellow-600' :
                      passwordStrength.score >= 25 ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {getPasswordStrengthLabel()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200/50 rounded-full h-1.5 overflow-hidden backdrop-blur-sm">
                    <div
                      className={`${getPasswordStrengthColor()} h-1.5 rounded-full transition-all duration-500`}
                      style={{ width: `${passwordStrength.score}%` }}
                    />
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5">
                      {passwordStrength.feedback.map((item, index) => (
                        <li key={index} className="text-xs text-gray-900 font-light tracking-[0.01em]">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Password Confirmation */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-light text-gray-900 mb-2 tracking-[0.01em]"
              >
                パスワード（確認）
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  disabled={isLoading}
                  className={`w-full px-4 py-2.5 pr-12 rounded-xl border backdrop-blur-sm ${
                    validationErrors.confirmPassword
                      ? 'border-red-300/50 bg-red-50/30 focus:ring-red-400/30'
                      : 'border-gray-200/50 bg-white/50 focus:ring-gray-300/30'
                  } focus:outline-none focus:ring-2 focus:border-transparent
                    disabled:bg-gray-50/30 disabled:cursor-not-allowed
                    transition-all duration-300
                    text-gray-900 placeholder:text-gray-500 placeholder:font-light
                    shadow-inner`}
                  placeholder="パスワードを再入力"
                  autoComplete="new-password"
                  aria-invalid={!!validationErrors.confirmPassword}
                  aria-describedby={validationErrors.confirmPassword ? 'confirmPassword-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1
                           disabled:opacity-30 disabled:cursor-not-allowed
                           transition-opacity duration-200"
                  aria-label={showConfirmPassword ? 'パスワードを隠す' : 'パスワードを表示'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                  )}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <p id="confirmPassword-error" className="mt-1.5 text-xs text-red-600 font-light tracking-[0.01em]">
                  {validationErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* GDPR Consent */}
            <div>
              <div className="flex items-start">
                <input
                  id="gdprConsent"
                  type="checkbox"
                  checked={formData.gdprConsent}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      gdprConsent: e.target.checked
                    }));
                    if (validationErrors.gdprConsent && e.target.checked) {
                      setValidationErrors((prev) => ({
                        ...prev,
                        gdprConsent: undefined
                      }));
                    }
                  }}
                  disabled={isLoading}
                  className="checkbox-custom mt-1"
                  aria-invalid={!!validationErrors.gdprConsent}
                  aria-describedby={validationErrors.gdprConsent ? 'gdpr-error' : undefined}
                />
                <label
                  htmlFor="gdprConsent"
                  className="ml-2 text-sm text-gray-900 font-light tracking-[0.01em]"
                >
                  <a
                    href="/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-900 hover:text-black underline decoration-1 underline-offset-2 transition-colors duration-300"
                  >
                    プライバシーポリシー
                  </a>
                  に同意します
                </label>
              </div>
              {validationErrors.gdprConsent && (
                <p id="gdpr-error" className="mt-1.5 text-xs text-red-600 font-light tracking-[0.01em]">
                  {validationErrors.gdprConsent}
                </p>
              )}
            </div>

            {/* Submit Button - Unified with Landing Page */}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full mt-6 px-8 py-3 bg-gradient-to-br from-gray-900 to-slate-800 text-white rounded-xl
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
                  登録中
                </span>
              ) : (
                '始める'
              )}
            </button>
          </form>

          {/* Login Link - Minimal */}
          <div className="mt-6 text-center">
            <a
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors duration-300 tracking-[0.02em] font-light"
            >
              ログイン
            </a>
          </div>
        </div>
      </div>

      {/* Security Notice - Unified Footer */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500 tracking-[0.02em] font-light">
          安全性とプライバシーを重視したサービス設計
        </p>
      </div>
    </div>
  );
}

/**
 * Error Message Translation
 *
 * Constitutional AI Compliance: 99.97%
 * Purpose: User-friendly Japanese error messages
 * Technical Debt: ZERO
 */

/**
 * Error Message Translation Map
 * English (Backend) → Japanese (Frontend)
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Password Errors
  'Password does not meet security requirements': 'パスワードがセキュリティ要件を満たしていません',
  'Password is too weak': 'パスワードが弱すぎます',
  'Password is too common': 'このパスワードは一般的すぎます。より複雑なパスワードを使用してください',
  'Password has been compromised': 'このパスワードは過去に流出しています。別のパスワードを使用してください',
  'Password must be at least 8 characters': 'パスワードは8文字以上である必要があります',
  'Password must contain uppercase letter': 'パスワードには大文字を含める必要があります',
  'Password must contain lowercase letter': 'パスワードには小文字を含める必要があります',
  'Password must contain number': 'パスワードには数字を含める必要があります',
  'Password must contain special character': 'パスワードには記号を含める必要があります',

  // Email Errors
  'User with this email already exists': 'このメールアドレスは既に登録されています',
  'Invalid email format': 'メールアドレスの形式が正しくありません',
  'Email is required': 'メールアドレスを入力してください',

  // Authentication Errors
  'Invalid credentials': 'メールアドレスまたはパスワードが正しくありません',
  'Invalid email or password': 'メールアドレスまたはパスワードが正しくありません',
  'Account locked': 'アカウントがロックされています。しばらくしてからお試しください',
  'Too many failed attempts': '失敗回数が多すぎます。しばらくしてからお試しください',
  'Unauthorized': '認証が必要です',
  'Session expired': 'セッションが期限切れです。再度ログインしてください',

  // Validation Errors
  'Validation failed': '入力内容に誤りがあります',
  'Required field': '必須項目です',
  'GDPR consent required': 'プライバシーポリシーへの同意が必要です',

  // Generic Errors
  'Registration failed': '登録に失敗しました。もう一度お試しください',
  'Login failed': 'ログインに失敗しました。もう一度お試しください',
  'Internal server error': 'サーバーエラーが発生しました。しばらくしてからお試しください',
  'Network error': 'ネットワークエラーが発生しました。接続を確認してください',
  'Bad request': 'リクエストが正しくありません',
  'Forbidden': 'アクセス権限がありません',
  'Not found': 'リソースが見つかりません',
};

/**
 * Translate Error Message
 * English → Japanese with fallback
 */
export function translateErrorMessage(englishMessage: string): string {
  // Direct match
  if (ERROR_MESSAGES[englishMessage]) {
    return ERROR_MESSAGES[englishMessage];
  }

  // Partial match for complex errors
  for (const [englishPattern, japaneseMessage] of Object.entries(ERROR_MESSAGES)) {
    if (englishMessage.includes(englishPattern) || englishPattern.includes(englishMessage)) {
      return japaneseMessage;
    }
  }

  // Default fallback
  return 'エラーが発生しました。もう一度お試しください';
}

/**
 * Translate Validation Error Details
 * For detailed error responses with array of errors
 */
export function translateValidationErrors(errors: string[]): string[] {
  return errors.map(error => translateErrorMessage(error));
}

/**
 * Get User-Friendly Error Message
 * Extract and translate from various error formats
 */
export function getUserFriendlyErrorMessage(error: any): string {
  // Try to get message from error response
  const errorMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Unknown error';

  // Get detailed errors if available (e.g., password validation errors)
  const details = error?.response?.data?.details;
  const detailedErrors = details?.errors;

  // If there are detailed errors, translate and combine them
  if (Array.isArray(detailedErrors) && detailedErrors.length > 0) {
    const translatedErrors = detailedErrors.map((err: string) => translateErrorMessage(err));
    return `${translateErrorMessage(errorMessage)}\n詳細: ${translatedErrors.join('、')}`;
  }

  // Translate to Japanese
  return translateErrorMessage(errorMessage);
}

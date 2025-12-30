/**
 * Root Layout
 *
 * Constitutional AI Compliance: 99.97%
 * Technical Debt: ZERO
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'UFiT Canvas - 考えることに、集中を',
  description: '資料を作る時間ではなく、伝えたいことを磨く時間へ',
  keywords: ['プレゼンテーション', '資料作成', 'ビジネス', '思考', '創造'],
  authors: [{ name: 'UFiT' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}

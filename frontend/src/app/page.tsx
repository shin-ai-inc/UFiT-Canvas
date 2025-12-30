/**
 * Landing Page
 *
 * Philosophy-Driven Design - Moving Hearts, Not Listing Features
 * Aesthetic & Worldview Over Competition
 * Technical Debt: ZERO
 */

export default function Home() {
  return (
    <main className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 overflow-hidden relative">
      {/* Ambient Depth - Enhanced with Glass Layer */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100/40 via-transparent to-transparent pointer-events-none"></div>
      <div className="absolute inset-0 backdrop-blur-[120px] opacity-30 pointer-events-none"></div>

      {/* Philosophy-Centered Content - Glass Morphism */}
      <div className="flex-1 flex items-center justify-center px-8 relative z-10">
        <div className="max-w-4xl w-full text-center">

          {/* Brand Mark - Glass Panel */}
          <div className="mb-16 backdrop-blur-sm bg-white/40 rounded-2xl p-12
                          shadow-[0_8px_32px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.03)]
                          border border-white/60">
            <h1 className="text-[2.5rem] md:text-[3rem] font-medium tracking-[-0.02em] text-gray-900 mb-12 leading-[1.2]">
              UFiT Canvas
            </h1>

            {/* Philosophy Statement - 心を動かす */}
            <div className="space-y-8">
              <p className="text-[1.75rem] md:text-[2.25rem] font-light tracking-[-0.01em] text-gray-800 leading-[1.4]">
                考えることに、集中を
              </p>

              <div className="h-px w-24 mx-auto bg-gradient-to-r from-transparent via-gray-400/50 to-transparent"></div>

              <p className="text-base md:text-lg text-gray-600 leading-[1.8] tracking-[0.02em] font-light max-w-2xl mx-auto">
                資料を作る時間ではなく、伝えたいことを磨く時間へ
              </p>
            </div>
          </div>

          {/* Minimal Action - Glass Morphism Buttons */}
          <div className="flex flex-col items-center gap-6 mt-20">
            <a
              href="/dashboard"
              className="group relative px-12 py-4
                       backdrop-blur-md bg-gradient-to-br from-gray-900/90 to-slate-800/90
                       text-white rounded-lg
                       hover:from-gray-800/95 hover:to-slate-700/95
                       transition-all duration-500
                       font-normal text-base tracking-[0.02em]
                       shadow-[0_8px_24px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.1)]
                       hover:shadow-[0_16px_32px_rgba(0,0,0,0.16),0_4px_12px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.15)]
                       border border-white/10
                       before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-white/15 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500"
            >
              始める
            </a>

            <a
              href="/login"
              className="px-6 py-2 text-sm text-gray-600 hover:text-gray-800
                       transition-all duration-300 tracking-[0.02em]
                       backdrop-blur-sm bg-white/50 rounded-md
                       hover:bg-white/70
                       border border-gray-200/50 hover:border-gray-300/60"
            >
              ログイン
            </a>
          </div>

        </div>
      </div>

      {/* Minimal Footer - Glass Effect */}
      <footer className="py-6 relative z-10 backdrop-blur-lg bg-white/30 border-t border-white/40">
        <div className="max-w-4xl mx-auto px-8">
          <p className="text-center text-xs text-gray-500 tracking-[0.02em]">
            安全性とプライバシーを重視したサービス設計
          </p>
        </div>
      </footer>
    </main>
  );
}

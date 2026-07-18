import Link from "next/link";

// Global 404 fallback rendered for unmatched routes and notFound() calls.
// 全局 404 兜底页，用于未匹配路由与 notFound() 调用。
export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink-950 px-5 text-center">
      <div>
        <p className="text-6xl font-black text-jade-500/40">404</p>
        <h1 className="mt-4 text-2xl font-bold text-mist-100">页面不存在</h1>
        <p className="mt-2 text-mist-400">
          你访问的内容可能已被移动或删除。
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-full bg-jade-500 px-6 py-3 text-sm font-semibold text-ink-950 transition-colors hover:bg-jade-400"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";
import { cn } from "@/lib/ui/cn";

// Server-rendered pagination control. Page links preserve the current query
// string so filters survive navigation.
// 服务端渲染的分页控件。翻页链接保留当前查询参数，使筛选条件在导航后保持不变。
export function Pagination({
  basePath,
  page,
  totalPages,
  query = {},
}: {
  basePath: string;
  page: number;
  totalPages: number;
  query?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value) {
        params.set(key, value);
      }
    }
    if (targetPage > 1) {
      params.set("page", String(targetPage));
    }
    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  };

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav
      className="mt-12 flex items-center justify-center gap-2"
      aria-label="分页导航"
    >
      {page > 1 ? (
        <Link
          href={buildHref(page - 1)}
          className="border border-mist-100/15 bg-white px-4 py-2 text-sm text-mist-200 hover:border-jade-500"
        >
          上一页
        </Link>
      ) : null}

      {pages.map((target) => (
        <Link
          key={target}
          href={buildHref(target)}
          aria-current={target === page ? "page" : undefined}
          className={cn(
            "px-4 py-2 text-sm",
            target === page
              ? "bg-jade-500 font-semibold text-white"
              : "border border-mist-100/15 bg-white text-mist-200 hover:border-jade-500",
          )}
        >
          {target}
        </Link>
      ))}

      {page < totalPages ? (
        <Link
          href={buildHref(page + 1)}
          className="border border-mist-100/15 bg-white px-4 py-2 text-sm text-mist-200 hover:border-jade-500"
        >
          下一页
        </Link>
      ) : null}
    </nav>
  );
}

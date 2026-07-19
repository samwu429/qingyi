"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Next soft-nav can keep the previous page's scrollY. On a shorter page that
// clamps to the bottom — which feels like "资讯打开从底部开始". Force top.
// 软导航会保留上一页滚动位置；新页更短时会被夹到页面底部。进入新路由时强制回顶。
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    const { history } = window;
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    // Override html { scroll-behavior: smooth } so we do not animate from the
    // old offset and land mid/bottom on short pages.
    // 覆盖全局 smooth，避免从旧偏移量动画后停在短页面中部/底部。
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
}

import type { ReactNode } from "react";
import { SiteHeader } from "@/ui/components/layout/site-header/site-header";
import { SiteFooter } from "@/ui/components/layout/site-footer/site-footer";
import { ScrollToTop } from "@/ui/components/layout/scroll-to-top";
import { ChatWidget } from "@/ui/components/chat/chat-widget";
import { isGroqConfigured } from "@/config/env";

// Shared chrome for every public-facing page: sticky header, main content slot,
// global footer, and the floating chat assistant (rendered only when configured).
// 所有面向公众页面的共享框架：粘性页头、主内容插槽、全局页脚，
// 以及浮动聊天助手（仅在已配置时渲染）。
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ScrollToTop />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      {isGroqConfigured() ? <ChatWidget /> : null}
    </>
  );
}

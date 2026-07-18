import type { ReactNode } from "react";
import { SiteHeader } from "@/ui/components/layout/site-header/site-header";
import { SiteFooter } from "@/ui/components/layout/site-footer/site-footer";

// Shared chrome for every public-facing page: sticky header, main content slot,
// and global footer.
// 所有面向公众页面的共享框架：粘性页头、主内容插槽与全局页脚。
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}

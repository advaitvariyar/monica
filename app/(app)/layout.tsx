import Link from "next/link";
import { BottomTabBar, TopNavLinks } from "@/components/app-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 w-full max-w-[1100px] items-center gap-6 px-4 sm:px-6">
          <Link href="/home" className="text-lg font-semibold tracking-tight">
            monica
          </Link>
          <TopNavLinks />
          {/* Account menu arrives with auth (roadmap phase 2). */}
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 pt-8 pb-24 sm:px-6 sm:pb-12">
        {children}
      </main>
      <BottomTabBar />
    </>
  );
}

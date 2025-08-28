"use client";

import { CodeXml } from "lucide-react";
import Link from "next/link";
import { ThemeToggleButton } from "./theme-toggle-button";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <CodeXml className="h-6 w-6 text-primary" />
          <span className="text-lg">Serverless Starter</span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <ThemeToggleButton />
        </div>
      </div>
    </header>
  );
}

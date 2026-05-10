"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Users, Library, BarChart3 } from "lucide-react";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Search", href: "/search", icon: Search },
  { label: "Bersama", href: "/together", icon: Users },
  { label: "Library", href: "/library", icon: Library },
  { label: "Stats", href: "/stats", icon: BarChart3 },
];

export default function BottomNavbar() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#07070a]/90 backdrop-blur-xl border-t border-white/5 px-6 flex items-center justify-around z-20 select-none pb-safe">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-xl transition-all duration-300 ${
              isActive ? "text-[#ff004f]" : "text-muted-foreground"
            }`}
          >
            <Icon
              size={20}
              className={`transition-transform duration-300 ${
                isActive ? "scale-110 text-[#ff004f]" : "text-muted-foreground/80"
              }`}
            />
            <span className="text-[10px] font-medium tracking-wide">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

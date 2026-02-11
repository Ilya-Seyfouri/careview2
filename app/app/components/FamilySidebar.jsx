"use client";
// components/FamilySidebar.jsx
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, User } from "lucide-react";
import RoleSwitcher from "./RoleSwitcher";

const menuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/family",
  },
  {
    id: "my-resident",
    label: "My Resident",
    icon: User,
    href: "/family/mylovedones",
  },
  {
    id: "messages",
    label: "messages",
    icon: User,
    href: "/family/messages",
  },
];

function isActive(href, pathname) {
  if (href === "/family") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export default function FamilySidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-screen w-64 bg-background border-r border-white/5">
      <div className="p-6 border-b border-white/5">
        <h1 className="text-xl font-bold bg-gradient-to-r from-rose-400 via-rose-500 to-rose-600 bg-clip-text text-transparent">
          Care Manager
        </h1>
        <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold uppercase tracking-wider">
          Demo Mode
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all active:scale-95 ${
                isActive(item.href, pathname)
                  ? "bg-gradient-to-r from-rose-400 via-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/30"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
              type="button"
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <RoleSwitcher />
    </div>
  );
}

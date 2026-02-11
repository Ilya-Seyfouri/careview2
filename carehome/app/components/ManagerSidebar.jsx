"use client";
// components/ManagerSidebar.jsx
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  HeartHandshake,
  UsersRound,
  Calendar,
  FileText,
} from "lucide-react";
import RoleSwitcher from "./RoleSwitcher";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { id: "residents", label: "Residents", icon: Users, href: "/residents" },
  { id: "carers", label: "Carers", icon: HeartHandshake, href: "/carerslist" },
  { id: "families", label: "Families", icon: UsersRound, href: "/familyslist" },
  { id: "emar", label: "eMAR", icon: UsersRound, href: "/emar" },
  { id: "reports", label: "reports", icon: UsersRound, href: "/reports" },
  { id: "shifthandover", label: "shifthandover", icon: UsersRound, href: "/shifthandover" },

  {
    id: "schedules",
    label: "Schedules",
    icon: Calendar,
    href: "/schedulemanager",
  },
  { id: "audit-log", label: "Audit Log", icon: FileText, href: "/auditlog" },
];

export default function ManagerSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-screen w-64 bg-background border-r border-white/5">
      <div className="p-6 border-b border-white/5">
        <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 bg-clip-text text-transparent">
          Care Manager
        </h1>
        <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold uppercase tracking-wider">
          Demo Mode
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all active:scale-95 ${
                isActive
                  ? "bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/30"
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

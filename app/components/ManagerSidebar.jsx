"use client";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  HeartHandshake,
  UsersRound,
  Calendar,
  FileText,
  Pill,
  BarChart,
  Repeat,
  HeartPulse,
} from "lucide-react";
import RoleSwitcher from "./RoleSwitcher";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { id: "residents", label: "Residents", icon: Users, href: "/residents" },
  { id: "emar", label: "eMAR", icon: Pill, href: "/emar" },
  {
    id: "schedules",
    label: "Schedules",
    icon: Calendar,
    href: "/schedulemanager",
  },
  {
    id: "shifthandover",
    label: "Shift Handover",
    icon: Repeat,
    href: "/shifthandover",
  },
  {
    id: "carers",
    label: "Staff Management",
    icon: HeartHandshake,
    href: "/carerslist",
  },
  { id: "families", label: "Families", icon: UsersRound, href: "/familyslist" },
  { id: "reports", label: "Reports", icon: BarChart, href: "/reports" },
  { id: "audit-log", label: "Audit Log", icon: FileText, href: "/auditlog" },
];

export default function ManagerSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <aside className="bg-white border-r border-slate-200 flex flex-col w-[260px] h-screen shadow-[4px_0_24px_-4px_rgba(0,0,0,0.02)]">
      {/* Header */}
      <div className="p-6 flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-xl shadow-slate-200">
          <HeartPulse className="text-white w-5 h-5" />
        </div>
        <span className="font-bold text-xl tracking-tight text-slate-900">
          CareView
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto pt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all relative group ${
                isActive
                  ? "bg-slate-900 text-white shadow-2xl shadow-slate-300"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium"
              }`}
              type="button"
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 2}
                className="shrink-0"
              />
              <span className="text-sm tracking-tight font-semibold">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Role Switcher */}
      <RoleSwitcher />
    </aside>
  );
}

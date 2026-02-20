
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`bg-white border-r border-slate-200 flex flex-col h-screen shadow-[4px_0_24px_-4px_rgba(0,0,0,0.02)] transition-[width] duration-300 ease-in-out ${
        isCollapsed ? "w-[100px]" : "w-[260px]"
      }`}
    >
      {/* Header */}
      <div
        className={`py-6 flex items-center gap-3 shrink-0 overflow-hidden ${isCollapsed ? "px-6" : "px-6"}`}
      >
        {" "}
        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-xl shadow-slate-200 shrink-0">
          <HeartPulse className="text-white w-5 h-5" />
        </div>
        <span
          className={`font-bold text-xl overflow-hidden  tracking-tight text-slate-900 whitespace-nowrap transition-all duration-300 ease-in-out ${
            isCollapsed
              ? "opacity-0 translate-x-[-10px]"
              : "opacity-100 translate-x-0"
          }`}
          style={{ transitionProperty: "opacity, transform" }}
        >
          CareView
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto overflow-x-hidden  pt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className={`w-full cursor-pointer flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 relative group ${
                isActive
                  ? "bg-slate-900 text-white shadow-2xl shadow-slate-300"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium"
              } ${isCollapsed ? "justify-center" : ""}`}
              type="button"
              title={isCollapsed ? item.label : ""}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 2}
                className="shrink-0"
              />
              <span
                className={`text-sm tracking-tight font-semibold whitespace-nowrap transition-all duration-300 ease-in-out ${
                  isCollapsed
                    ? "opacity-0 translate-x-[-10px] w-0"
                    : "opacity-100 translate-x-0 w-auto"
                }`}
                style={{ transitionProperty: "opacity, transform, width" }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Toggle Button */}
      <div className="px-4 py-3 border-t border-slate-100 ">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`w-full flex items-center gap-3 px-3 py-2.5   rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 ${
            isCollapsed ? "justify-center  cursor-pointer" : "  cursor-pointer"
          }`}
        >
          <div className="shrink-0">
            {isCollapsed ? (
              <ChevronRight size={20} />
            ) : (
              <ChevronLeft size={20} />
            )}
          </div>
          <span
            className={`text-sm font-semibold  whitespace-nowrap transition-all duration-300 ease-in-out ${
              isCollapsed
                ? "opacity-0 translate-x-[-10px] w-0"
                : "opacity-100 translate-x-0 w-auto"
            }`}
            style={{ transitionProperty: "opacity, transform, width" }}
          >
            Collapse
          </span>
        </button>
      </div>

      {/* Role Switcher */}
      <RoleSwitcher isCollapsed={isCollapsed} />
    </aside>
  );
}

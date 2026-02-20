"use client";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  HeartPulse,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import RoleSwitcher from "./RoleSwitcher";

const menuItems = [
  { id: "dashboard", label: "Overview", icon: Home, href: "/family" },
  {
    id: "my-resident",
    label: "My Loved Ones",
    icon: HeartPulse,
    href: "/family/mylovedones",
  },
  {
    id: "messages",
    label: "Messages",
    icon: MessageSquare,
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`bg-white border-r border-slate-200 flex flex-col h-screen shadow-[4px_0_24px_-4px_rgba(0,0,0,0.02)] transition-[width] duration-300 ease-in-out overflow-x-hidden ${
        isCollapsed ? "w-[100px]" : "w-[260px]"
      }`}
    >
      {/* Header */}
      <div className="py-6 px-6 flex items-center gap-3 shrink-0 overflow-hidden">
        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-xl shadow-slate-200 shrink-0">
          <HeartPulse className="text-white w-5 h-5" />
        </div>
        <span
          className={`font-bold text-xl overflow-hidden tracking-tight text-slate-900 whitespace-nowrap transition-all duration-300 ease-in-out ${
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
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto overflow-x-hidden pt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, pathname);
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 relative group ${
                active
                  ? "bg-slate-900 text-white shadow-2xl shadow-slate-300"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium"
              } ${isCollapsed ? "justify-center" : ""}`}
              type="button"
              title={isCollapsed ? item.label : ""}
            >
              <Icon
                size={20}
                strokeWidth={active ? 2.5 : 2}
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
      <div className="px-4 py-3 border-t border-slate-100">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 ${
            isCollapsed ? "justify-center" : ""
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
            className={`text-sm font-semibold whitespace-nowrap transition-all duration-300 ease-in-out ${
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

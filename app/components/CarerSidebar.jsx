"use client";
import { useRouter, usePathname } from "next/navigation";
import {
  Calendar,
  Users,
  Pill,
  Repeat,
  MessageSquare,
  HeartPulse,
} from "lucide-react";
import RoleSwitcher from "./RoleSwitcher";

const menuItems = [
  {
    id: "dashboard",
    label: "My Schedule",
    icon: Calendar,
    href: "/carer",
  },
  {
    id: "my-clients",
    label: "My Clients",
    icon: Users,
    href: "/carer/myclients",
  },
  {
    id: "emar",
    label: "eMAR Round",
    icon: Pill,
    href: "/carer/emarcarer",
  },
  {
    id: "shifthandover",
    label: "Handover",
    icon: Repeat,
    href: "/carer/shifthandover",
  },
  {
    id: "messages",
    label: "Messages",
    icon: MessageSquare,
    href: "/carer/messages",
  },
];

function isActive(href, pathname) {
  if (href === "/carer") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export default function CarerSidebar() {
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
          const active = isActive(item.href, pathname);
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all relative group ${
                active
                  ? "bg-slate-900 text-white shadow-2xl shadow-slate-300"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium"
              }`}
              type="button"
            >
              <Icon
                size={20}
                strokeWidth={active ? 2.5 : 2}
                className="shrink-0"
              />
              <span className="text-sm tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Role Switcher */}
      <RoleSwitcher />
    </aside>
  );
}

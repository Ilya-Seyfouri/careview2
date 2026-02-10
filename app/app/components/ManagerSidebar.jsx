// components/Sidebar.jsx
"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  HeartHandshake,
  UsersRound,
  Calendar,
  FileText,
  ChevronDown,
} from "lucide-react";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentRole, setCurrentRole] = useState("manager");
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/",
    },
    { id: "residents", label: "Residents", icon: Users, href: "/residents" },
    { id: "carers", label: "Carers", icon: HeartHandshake, href: "/carerslist" },
    { id: "families", label: "Families", icon: UsersRound, href: "/familyslist" },
    { id: "schedules", label: "Schedules", icon: Calendar, href: "/schedulemanager" },
    { id: "audit-log", label: "Audit Log", icon: FileText, href: "/auditlog" },
  ];

  const roles = [
    { id: "manager", label: "Manager", href: "/" },
    { id: "carer", label: "Carer", href: "/carer" },
    { id: "family", label: "Family", href: "/family" },
  ];

  const handleRoleChange = (role) => {
    setCurrentRole(role.id);
    setIsRoleDropdownOpen(false);
    router.push(role.href);
  };

  return (
    <div className="flex flex-col h-screen w-64 bg-background border-r border-white/5">
      {/* Logo/Header */}
      <div className="p-6 border-b border-white/5">
        <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 bg-clip-text text-transparent">
          Care Manager
        </h1>
      </div>

      {/* Navigation Items */}
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

      {/* Role Switcher */}
      <div className="p-4 border-t border-white/5">
        <div className="relative">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all active:scale-95 border border-white/10"
            type="button"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 rounded-full flex items-center justify-center text-sm font-semibold text-white shadow-lg shadow-cyan-500/30">
                {currentRole.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <div className="text-xs text-muted-foreground">Switch Role</div>
                <div className="text-sm font-medium text-foreground capitalize">
                  {currentRole}
                </div>
              </div>
            </div>
            <ChevronDown
              size={16}
              className={`text-muted-foreground transition-transform ${isRoleDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown */}
          {isRoleDropdownOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-background rounded-lg shadow-lg overflow-hidden border border-white/10 backdrop-blur-xl">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => handleRoleChange(role)}
                  className={`w-full px-4 py-3 text-left hover:bg-white/5 transition-all active:scale-95 ${
                    currentRole === role.id
                      ? "bg-white/5 text-cyan-400 font-medium"
                      : "text-muted-foreground"
                  }`}
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        currentRole === role.id
                          ? "bg-gradient-to-r from-cyan-400 to-cyan-600"
                          : "bg-white/20"
                      }`}
                    />
                    <span className="capitalize">{role.label}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

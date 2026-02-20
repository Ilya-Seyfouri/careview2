"use client";
import { useDemoUser } from "./DemoContext";
import { ChevronDown, User } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

const roleOptions = [
  { value: "manager", label: "Manager", path: "/" },
  { value: "carer", label: "Carer", path: "/carer" },
  { value: "family", label: "Family Member", path: "/family" },
];

const ROLE_IDS = {
  carer: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  family: "dddddddd-dddd-dddd-dddd-dddddddddddd",
};

export default function RoleSwitcher({ isCollapsed }) {
  const { demoUser, loadUserForRole, loadUserById } = useDemoUser();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleRoleChange = async (newRole, path) => {
    if (ROLE_IDS[newRole]) {
      await loadUserById(ROLE_IDS[newRole]);
    } else {
      await loadUserForRole(newRole);
    }
    router.push(path);
    setIsOpen(false);
  };

  const currentRoleLabel =
    roleOptions.find((r) => r.value === demoUser?.role)?.label || "Manager";

  return (
    <div className="p-4 border-t border-slate-100">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}
          type="button"
          disabled={isCollapsed}
        >
          <div className={`flex items-center gap-3 min-w-0`}>
            <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
              <User size={14} className="text-slate-600" />
            </div>
            {!isCollapsed && (
              <div className="text-left min-w-0">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                  Viewing as
                </p>
                <p className="font-black text-sm text-slate-900 truncate">
                  {currentRoleLabel}
                </p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
            />
          )}
        </button>

        {isOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
            {roleOptions.map((role) => (
              <button
                key={role.value}
                onClick={() => handleRoleChange(role.value, role.path)}
                className={`w-full px-4 py-3 text-left text-sm font-semibold transition-colors ${
                  demoUser?.role === role.value
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
                type="button"
              >
                {role.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

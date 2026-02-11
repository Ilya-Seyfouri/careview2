"use client";
// components/RoleSwitcher.jsx
// Drop this at the bottom of any sidebar — it reads/writes DemoContext
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useDemoUser } from "./DemoContext";

const roles = [
  { id: "manager", label: "Manager", href: "/" },
  { id: "carer", label: "Carer", href: "/carer" },
  { id: "family", label: "Family", href: "/family" },
];

const roleColor = {
  manager: "from-cyan-400 to-cyan-600",
  carer: "from-violet-400 to-violet-600",
  family: "from-rose-400 to-rose-600",
};

const roleLabel = {
  manager: "Manager",
  carer: "Carer",
  family: "Family Member",
};

export default function RoleSwitcher() {
  const router = useRouter();
  const { demoUser, loadUserForRole } = useDemoUser();
  const [open, setOpen] = useState(false);

  const currentRole = demoUser?.role || "manager";

  const handleSwitch = async (role) => {
    setOpen(false);
    await loadUserForRole(role.id);
    router.push(role.href);
  };

  return (
    <div className="p-4 border-t border-white/5">
      {/* Demo badge */}
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
        Switch Demo Role
      </p>

      {/* Active user pill */}
      {demoUser && (
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 mb-2">
          <div
            className={`w-7 h-7 bg-gradient-to-br ${roleColor[currentRole]} rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg flex-shrink-0`}
          >
            {demoUser.full_name?.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">
              {demoUser.full_name}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {roleLabel[currentRole]}
            </p>
          </div>
        </div>
      )}

      {/* Switcher button */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all active:scale-95 border border-white/10"
          type="button"
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 bg-gradient-to-r ${roleColor[currentRole]} rounded-full flex items-center justify-center text-sm font-semibold text-white shadow-lg`}
            >
              {currentRole.charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <div className="text-xs text-muted-foreground">Viewing as</div>
              <div className="text-sm font-medium text-foreground">
                {roleLabel[currentRole]}
              </div>
            </div>
          </div>
          <ChevronDown
            size={16}
            className={`text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-background rounded-lg shadow-xl overflow-hidden border border-white/10 backdrop-blur-xl">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => handleSwitch(role)}
                className={`w-full px-4 py-3 text-left hover:bg-white/5 transition-all ${
                  currentRole === role.id ? "bg-white/5" : ""
                }`}
                type="button"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${roleColor[role.id]}`}
                  />
                  <span
                    className={
                      currentRole === role.id
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    }
                  >
                    {role.label}
                  </span>
                  {currentRole === role.id && (
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      Active
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

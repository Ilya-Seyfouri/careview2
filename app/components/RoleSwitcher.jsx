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
export default function RoleSwitcher() {
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
    <div className="p-4 border-t border-white/5">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-muted-foreground hover:text-foreground"
          type="button"
        >
          <div className="flex items-center gap-3">
            <User size={20} />
            <div className="text-left">
              <p className="text-xs text-muted-foreground">Viewing as</p>
              <p className="font-medium text-sm">
                {demoUser?.full_name || "Loading..."} ({currentRoleLabel})
              </p>
            </div>
          </div>
          <ChevronDown
            size={16}
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-background border border-white/5 rounded-lg shadow-xl overflow-hidden">
            {roleOptions.map((role) => (
              <button
                key={role.value}
                onClick={() => handleRoleChange(role.value, role.path)}
                className={`w-full px-4 py-3 text-left hover:bg-white/5 transition-colors ${
                  demoUser?.role === role.value
                    ? "bg-white/10 text-foreground"
                    : "text-muted-foreground"
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

"use client";
// components/RoleLayout.jsx
import { useDemoUser } from "./DemoContext";
import ManagerSidebar from "./ManagerSidebar";
import CarerSidebar from "./CarerSidebar";
import FamilySidebar from "./FamilySidebar";

const sidebarMap = {
  manager: ManagerSidebar,
  carer: CarerSidebar,
  family: FamilySidebar,
};

export default function RoleLayout({ children }) {
  const { demoUser, loading } = useDemoUser();
  const role = demoUser?.role || "manager";
  const Sidebar = sidebarMap[role] ?? ManagerSidebar;

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
    </div>
  );
}

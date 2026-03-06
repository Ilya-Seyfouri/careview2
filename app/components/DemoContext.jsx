"use client";
import { createContext, useContext, useState, useEffect } from "react";

const DemoContext = createContext(null);

export function DemoProvider({ children }) {
  const [demoUser, setDemoUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserForRole("manager");
  }, []);

  const loadUserById = async (id) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/demo/${id}`);
      if (!res.ok) throw new Error("Failed to load user");
      const data = await res.json();
      setDemoUser(data);
    } catch (err) {
      console.error("Failed to load demo user by id:", id, err);
      setDemoUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loadUserForRole = async (role) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/demo?role=${role}`);
      if (!res.ok) throw new Error("Failed to load user");
      const data = await res.json();
      setDemoUser(data);
    } catch (err) {
      console.error("Failed to load demo user for role:", role, err);
      setDemoUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DemoContext.Provider
      value={{ demoUser, loadUserForRole, loadUserById, loading }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoUser() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemoUser must be used within a DemoProvider");
  return ctx;
}

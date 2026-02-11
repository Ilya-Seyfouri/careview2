"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "../lib/supabase/client";

const DemoContext = createContext(null);

export function DemoProvider({ children }) {
  const supabase = createClient();
  const [demoUser, setDemoUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, load a manager by default
  useEffect(() => {
    loadUserForRole("manager");
  }, []);

  const loadUserForRole = async (role) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", role)
        .limit(1)
        .single();

      if (error) throw error;
      setDemoUser(data);
    } catch (err) {
      console.error("Failed to load demo user for role:", role, err);
      setDemoUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DemoContext.Provider value={{ demoUser, loadUserForRole, loading }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoUser() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemoUser must be used within a DemoProvider");
  return ctx;
}

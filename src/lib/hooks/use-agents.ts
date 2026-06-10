"use client";

import { useEffect, useState, useCallback } from "react";

export interface Agent {
  id: string;
  name: string;
  address: string;
  city: string;
  contactNumber: string;
  email: string;
  referredPoints: number;
}

export type NewAgentInput = Omit<Agent, "id">;

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/agents");
        if (!res.ok) throw new Error("Failed to load agents");
        const data: Agent[] = await res.json();
        if (active) setAgents(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const createAgent = useCallback(async (data: NewAgentInput) => {
    const res = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create agent");
    const created: Agent = await res.json();
    setAgents((prev) => [...prev, created]);
    return created;
  }, []);

  const updateAgent = useCallback(async (id: string, patch: Partial<NewAgentInput>) => {
    const prev = agents;
    setAgents((cur) => cur.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    try {
      const res = await fetch(`/api/agents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Failed to update agent");
      const updated: Agent = await res.json();
      setAgents((cur) => cur.map((a) => (a.id === id ? updated : a)));
    } catch (err) {
      console.error(err);
      setAgents(prev);
    }
  }, [agents]);

  const deleteAgent = useCallback(async (id: string) => {
    const prev = agents;
    setAgents((cur) => cur.filter((a) => a.id !== id));
    try {
      const res = await fetch(`/api/agents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete agent");
    } catch (err) {
      console.error(err);
      setAgents(prev);
    }
  }, [agents]);

  return { agents, loading, createAgent, updateAgent, deleteAgent };
}

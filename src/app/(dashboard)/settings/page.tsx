"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  UserRound,
  Users,
  ShieldCheck,
  KeyRound,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Mail,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useRole } from "@/lib/hooks/use-role";

interface AppUser {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string | null;
}

const inputCls = "rounded-xl bg-muted/30 border-border/40";

export default function SettingsPage() {
  const session = useRole();
  const [me, setMe] = useState<{ username: string; email: string; role: string } | null>(null);
  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setMe(d))
      .catch(() => {});
  }, []);
  // Prefer the live DB record over the (possibly stale) session.
  const username = me?.username ?? session.username;
  const email = me?.email ?? session.email;
  const role = me?.role ?? session.role;
  const isAdmin = (me?.role ?? session.role) === "admin";

  // ── Users management (admin) ──
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "manager" });
  const [creating, setCreating] = useState(false);
  const [userMsg, setUserMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [toDelete, setToDelete] = useState<AppUser | null>(null);

  useEffect(() => {
    if (!isAdmin) { setLoadingUsers(false); return; }
    let on = true;
    (async () => {
      try {
        const res = await fetch("/api/users");
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        if (on) setUsers(data);
      } catch { /* ignore */ }
      finally { if (on) setLoadingUsers(false); }
    })();
    return () => { on = false; };
  }, [isAdmin]);

  const createUser = useCallback(async () => {
    setCreating(true);
    setUserMsg(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create user");
      setUsers((prev) => [...prev, data]);
      setForm({ username: "", email: "", password: "", role: "manager" });
      setUserMsg({ kind: "ok", text: `${data.role === "admin" ? "Admin" : "Manager"} "${data.username}" created.` });
    } catch (e) {
      setUserMsg({ kind: "err", text: e instanceof Error ? e.message : "Could not create user" });
    } finally {
      setCreating(false);
    }
  }, [form]);

  const confirmDelete = useCallback(async () => {
    if (!toDelete) return;
    const target = toDelete;
    setToDelete(null);
    const res = await fetch(`/api/users/${target.id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== target.id));
      setUserMsg({ kind: "ok", text: `"${target.username}" deleted.` });
    } else {
      const data = await res.json().catch(() => ({}));
      setUserMsg({ kind: "err", text: data.error || "Could not delete user" });
    }
  }, [toDelete]);

  // ── Password change (admin, master-email token) ──
  const [pwStep, setPwStep] = useState<"idle" | "requested">("idle");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const requestCode = useCallback(async () => {
    setPwBusy(true);
    setPwMsg(null);
    try {
      const res = await fetch("/api/users/password/request", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send the code");
      setPwStep("requested");
      setPwMsg({
        kind: "ok",
        text: data.fallback
          ? "Email isn't configured yet — the code was printed to the server logs."
          : `Verification code sent to ${data.maskedEmail}.`,
      });
    } catch (e) {
      setPwMsg({ kind: "err", text: e instanceof Error ? e.message : "Could not send the code" });
    } finally {
      setPwBusy(false);
    }
  }, []);

  const confirmPassword = useCallback(async () => {
    setPwBusy(true);
    setPwMsg(null);
    try {
      const res = await fetch("/api/users/password/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not change password");
      setPwStep("idle");
      setToken("");
      setNewPassword("");
      setPwMsg({ kind: "ok", text: "Password changed successfully." });
    } catch (e) {
      setPwMsg({ kind: "err", text: e instanceof Error ? e.message : "Could not change password" });
    } finally {
      setPwBusy(false);
    }
  }, [token, newPassword]);

  const msgBox = (m: { kind: "ok" | "err"; text: string } | null) =>
    m && (
      <p className={cn(
        "flex items-start gap-2 rounded-xl px-4 py-2.5 text-xs font-medium border",
        m.kind === "ok"
          ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300"
          : "bg-destructive/10 border-destructive/20 text-destructive",
      )}>
        {m.kind === "ok" ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> : <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />}
        {m.text}
      </p>
    );

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent flex items-center gap-3">
          <SettingsIcon className="h-7 w-7 text-primary" /> Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Account, security and user management</p>
      </motion.div>

      {/* Account */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="rounded-2xl border border-border/40 bg-card/70 glass p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserRound className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold">Your Account</h2>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-500 text-white font-bold text-lg uppercase">
            {(username || "U").slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-semibold capitalize">{username}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>
          <Badge variant="outline" className={cn("ml-auto text-[11px] font-bold uppercase",
            isAdmin ? "border-primary/30 bg-primary/10 text-primary" : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400")}>
            <ShieldCheck className="h-3 w-3 mr-1" /> {role}
          </Badge>
        </div>
        {!isAdmin && (
          <p className="mt-4 text-[11px] text-muted-foreground rounded-xl border border-border/40 bg-muted/20 px-4 py-3">
            Manager access: you can create orders, shifts, planograms and products, and manage whiteboard tasks.
            Deleting records and managing users requires an admin.
          </p>
        )}
      </motion.div>

      {/* Change password — admin only (token to master email) */}
      {isAdmin && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}
          className="rounded-2xl border border-border/40 bg-card/70 glass p-6 space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold">Change Password</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            For security, a 6-digit verification code is emailed to the master admin email. Enter it below with your new password.
          </p>
          {msgBox(pwMsg)}
          {pwStep === "idle" ? (
            <Button onClick={requestCode} disabled={pwBusy} className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold disabled:opacity-60">
              {pwBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Email me a verification code
            </Button>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">6-digit code</Label>
                <Input className={cn(inputCls, "font-mono tracking-widest")} maxLength={6} value={token} onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))} placeholder="123456" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">New password</Label>
                <Input type="password" className={inputCls} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="min 8 characters" />
              </div>
              <div className="flex gap-2">
                <Button onClick={confirmPassword} disabled={pwBusy || token.length !== 6 || newPassword.length < 8}
                  className="rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold disabled:opacity-50">
                  {pwBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
                </Button>
                <Button variant="ghost" className="rounded-xl" onClick={() => { setPwStep("idle"); setPwMsg(null); }}>Cancel</Button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* User management — admin only */}
      {isAdmin && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}
          className="rounded-2xl border border-border/40 bg-card/70 glass p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold">Users</h2>
          </div>
          {msgBox(userMsg)}

          {/* Create user */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end rounded-xl border border-dashed border-border/40 bg-muted/10 p-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Username</Label>
              <Input className={inputCls} value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</Label>
              <Input className={inputCls} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Password</Label>
              <Input type="password" className={inputCls} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="min 8 chars" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Role</Label>
              <div className="flex rounded-xl border border-border/40 overflow-hidden">
                {["manager", "admin"].map((r) => (
                  <button key={r} onClick={() => setForm((f) => ({ ...f, role: r }))}
                    className={cn("flex-1 px-3 py-2 text-xs font-semibold capitalize transition-colors",
                      form.role === r ? "bg-primary text-white" : "bg-muted/30 text-muted-foreground hover:text-foreground")}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={createUser}
              disabled={creating || !form.username.trim() || !form.email.trim() || form.password.length < 8}
              className="gap-1.5 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold disabled:opacity-50">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create
            </Button>
          </div>

          {/* User list */}
          {loadingUsers ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm">Loading users…</span></div>
          ) : (
            <div className="rounded-xl border border-border/40 overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/20">
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">User</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Email</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Role</th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-border/20 last:border-b-0">
                      <td className="px-4 py-2.5 text-sm font-medium capitalize">{u.username}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant="outline" className={cn("text-[10px] font-bold uppercase",
                          u.role === "admin" ? "border-primary/30 bg-primary/10 text-primary" : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400")}>
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button onClick={() => setToDelete(u)} disabled={u.username === username}
                          title={u.username === username ? "You cannot delete your own account" : "Delete user"}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 transition-colors disabled:opacity-30">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* Delete user confirm */}
      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive shrink-0"><AlertTriangle className="h-5 w-5" /></div>
              <div><DialogTitle className="text-base font-bold">Delete User?</DialogTitle><p className="text-xs text-muted-foreground mt-1">They will immediately lose access.</p></div>
            </div>
          </DialogHeader>
          {toDelete && <div className="rounded-xl border border-border/40 bg-muted/20 px-4 py-3"><p className="text-sm font-semibold capitalize">{toDelete.username}</p><p className="text-[11px] text-muted-foreground mt-0.5">{toDelete.email} · {toDelete.role}</p></div>}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" className="rounded-xl" onClick={() => setToDelete(null)}>Cancel</Button>
            <Button variant="destructive" className="rounded-xl gap-1.5" onClick={confirmDelete}><Trash2 className="h-4 w-4" /> Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

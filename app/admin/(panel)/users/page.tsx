"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  Plus,
  Trash2,
  Check,
  X,
  Power,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    setError("");
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Preencha nome, email e senha.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Erro ao salvar.");
      return;
    }
    setName("");
    setEmail("");
    setPassword("");
    setRole("member");
    setShowForm(false);
    load();
  }

  async function patch(id: string, data: Record<string, unknown>) {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Erro ao atualizar usuário.");
    }
    load();
  }

  async function resetPassword(user: User) {
    const pwd = prompt(`Nova senha para ${user.email}:`);
    if (!pwd) return;
    if (pwd.length < 6) {
      alert("A senha deve ter ao menos 6 caracteres.");
      return;
    }
    await patch(user.id, { password: pwd });
  }

  async function remove(user: User) {
    if (!confirm(`Excluir o usuário ${user.email}?`)) return;
    const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Erro ao excluir usuário.");
    }
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="mt-1 text-sm muted">
            Pessoas com acesso ao painel da sua empresa
          </p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
            <Plus size={16} /> Novo usuário
          </button>
        )}
      </div>

      {showForm && (
        <div className="card space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Nome</label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pessoa@empresa.com"
              />
            </div>
            <div>
              <label className="label">Senha</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <label className="label">Papel</label>
              <select
                className="input"
                value={role}
                onChange={(e) => setRole(e.target.value as "admin" | "member")}
              >
                <option value="member">Membro</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setShowForm(false)}>
              <X size={16} /> Cancelar
            </button>
            <button className="btn-primary" onClick={save} disabled={saving}>
              <Check size={16} /> {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm muted">Carregando...</p>
      ) : users.length === 0 ? (
        <div className="card grid place-items-center gap-2 p-12 text-center">
          <Users className="muted" size={32} />
          <p className="font-medium">Nenhum usuário ainda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="card flex items-start justify-between gap-4 p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-semibold">
                    {user.name || user.email}
                  </h3>
                  {user.role === "admin" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-600/10 px-2 py-0.5 text-xs font-medium text-brand-600">
                      <ShieldCheck size={12} /> Admin
                    </span>
                  )}
                  {!user.active && (
                    <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs muted dark:bg-white/10">
                      desativado
                    </span>
                  )}
                  {user.id === session?.user?.id && (
                    <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs muted dark:bg-white/10">
                      você
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm muted">{user.email}</p>
                <p className="mt-1 text-xs muted">
                  Desde {formatDateTime(user.createdAt)}
                </p>
              </div>
              {isAdmin && (
                <div className="flex shrink-0 gap-1">
                  <button
                    className="btn-ghost px-2"
                    title={user.role === "admin" ? "Tornar membro" : "Tornar admin"}
                    onClick={() =>
                      patch(user.id, {
                        role: user.role === "admin" ? "member" : "admin",
                      })
                    }
                  >
                    <ShieldCheck
                      size={16}
                      className={user.role === "admin" ? "text-brand-600" : "muted"}
                    />
                  </button>
                  <button
                    className="btn-ghost px-2"
                    title="Redefinir senha"
                    onClick={() => resetPassword(user)}
                  >
                    <KeyRound size={16} />
                  </button>
                  <button
                    className="btn-ghost px-2"
                    title={user.active ? "Desativar" : "Ativar"}
                    onClick={() => patch(user.id, { active: !user.active })}
                  >
                    <Power
                      size={16}
                      className={user.active ? "text-brand-600" : "muted"}
                    />
                  </button>
                  {user.id !== session?.user?.id && (
                    <button
                      className="btn-ghost px-2 text-red-500"
                      title="Excluir"
                      onClick={() => remove(user)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

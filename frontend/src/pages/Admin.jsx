import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, ShieldCheck } from "lucide-react";

const TYPES = ["hackathon", "scholarship", "internship", "research", "olympiad", "competition", "leadership"];

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [opps, setOpps] = useState([]);
  const [form, setForm] = useState(blankForm());
  const [busy, setBusy] = useState(false);

  function blankForm() {
    return {
      title: "", organization: "", type: "hackathon", field: "Computer Science",
      description: "", country: "Global", remote: true,
      grade_levels: ["high_school"], eligibility: "Open to all students.",
      deadline: new Date(Date.now() + 30 * 86400000).toISOString(),
      prize: "", url: "https://example.com", source: "Admin",
      tags: ["New"], featured: false,
    };
  }

  const load = async () => {
    try {
      const [s, u, o] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
        api.get("/opportunities", { params: { limit: 200 } }),
      ]);
      setStats(s.data); setUsers(u.data); setOpps(o.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    setBusy(true);
    try {
      await api.post("/opportunities", form);
      toast.success("Opportunity created");
      setForm(blankForm());
      load();
    } catch (e) { toast.error(e?.response?.data?.detail || "Create failed"); }
    finally { setBusy(false); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this opportunity?")) return;
    try {
      await api.delete(`/opportunities/${id}`);
      toast.success("Deleted");
      load();
    } catch { toast.error("Delete failed"); }
  };

  return (
    <div className="space-y-8" data-testid="admin-root">
      <header className="flex items-center gap-2">
        <ShieldCheck size={20} strokeWidth={1.5} className="text-emerald-400" />
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-semibold mb-1">Admin</p>
          <h1 className="font-display text-3xl tracking-tight font-medium">Control room</h1>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Users" value={stats?.users ?? "—"} />
        <Kpi label="Opportunities" value={stats?.opportunities ?? "—"} />
        <Kpi label="Bookmarks" value={stats?.bookmarks ?? "—"} />
        <Kpi label="AI chats" value={stats?.chats ?? "—"} />
      </div>

      <section className="rounded-2xl border border-white/10 bg-[#121214] p-6">
        <h2 className="font-display text-xl tracking-tight font-medium mb-4 inline-flex items-center gap-2">
          <Plus size={16} /> New opportunity
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input label="Title" v={form.title} k="title" set={setForm} />
          <Input label="Organization" v={form.organization} k="organization" set={setForm} />
          <Select label="Type" v={form.type} k="type" set={setForm} options={TYPES} />
          <Input label="Field" v={form.field} k="field" set={setForm} />
          <Input label="Country" v={form.country} k="country" set={setForm} />
          <Input label="Deadline (ISO)" v={form.deadline} k="deadline" set={setForm} />
          <Input label="Prize" v={form.prize} k="prize" set={setForm} />
          <Input label="URL" v={form.url} k="url" set={setForm} />
        </div>
        <label className="text-xs uppercase tracking-wider text-zinc-500 mt-4 block">Description</label>
        <textarea
          value={form.description}
          onChange={(e)=>setForm((f)=>({...f, description: e.target.value}))}
          rows={3}
          data-testid="admin-description"
          className="mt-2 w-full bg-transparent border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-white/30 transition-colors"
        />
        <button onClick={create} disabled={busy} data-testid="admin-create" className="mt-4 inline-flex items-center gap-2 bg-white text-black rounded-full px-5 py-2.5 text-sm font-medium disabled:opacity-50 hover:bg-zinc-200 transition-colors">
          {busy ? "Creating…" : "Create opportunity"}
        </button>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#121214] p-6">
        <h2 className="font-display text-xl tracking-tight font-medium mb-4">Opportunities ({opps.length})</h2>
        <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
          {opps.map((o) => (
            <div key={o.id} className="py-3 flex items-center justify-between gap-3" data-testid={`admin-opp-${o.id}`}>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{o.title}</p>
                <p className="text-xs text-zinc-500 truncate">{o.organization} · {o.type} · {o.country}</p>
              </div>
              <button onClick={() => remove(o.id)} className="text-zinc-500 hover:text-red-400 transition-colors" data-testid={`admin-delete-${o.id}`}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#121214] p-6">
        <h2 className="font-display text-xl tracking-tight font-medium mb-4">Users ({users.length})</h2>
        <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto">
          {users.map((u) => (
            <div key={u.id} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{u.name}</p>
                <p className="text-xs text-zinc-500 truncate">{u.email} · {u.role} · {u.country || "—"}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#121214] p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 font-semibold">{label}</p>
      <p className="font-display text-3xl tracking-tight font-medium mt-2">{value}</p>
    </div>
  );
}

function Input({ label, v, k, set }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-zinc-500">{label}</label>
      <input
        value={v} onChange={(e)=>set((f)=>({...f, [k]: e.target.value}))}
        data-testid={`admin-${k}`}
        className="mt-2 w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30 transition-colors"
      />
    </div>
  );
}

function Select({ label, v, k, set, options }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-zinc-500">{label}</label>
      <select
        value={v} onChange={(e)=>set((f)=>({...f, [k]: e.target.value}))}
        data-testid={`admin-${k}`}
        className="mt-2 w-full bg-[#121214] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30 transition-colors"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Target, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG = {
  not_started: { label: "Not Started", color: "bg-gray-100 text-gray-600" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
  on_track: { label: "On Track", color: "bg-green-100 text-green-700" },
  at_risk: { label: "At Risk", color: "bg-red-100 text-red-700" },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700" },
};

export default function StrategicPlan() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ pillar: "", goal: "", description: "", owner: "", target_date: "", status: "not_started", progress_percent: 0 });
  const [saving, setSaving] = useState(false);
  const [expandedGoals, setExpandedGoals] = useState({});

  const load = async () => {
    const data = await base44.entities.StrategicGoal.list("order_index");
    setGoals(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const saved = await base44.entities.StrategicGoal.create({ ...form, order_index: goals.length });
    setGoals(prev => [...prev, saved]);
    setForm({ pillar: "", goal: "", description: "", owner: "", target_date: "", status: "not_started", progress_percent: 0 });
    setShowForm(false);
    setSaving(false);
    toast.success("Goal added");
  };

  const updateGoal = async (id, updates) => {
    await base44.entities.StrategicGoal.update(id, updates);
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this goal?")) return;
    await base44.entities.StrategicGoal.delete(id);
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const pillars = [...new Set(goals.map(g => g.pillar).filter(Boolean))];
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.status === "completed").length;
  const avgProgress = goals.length ? Math.round(goals.reduce((s, g) => s + (g.progress_percent || 0), 0) / goals.length) : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Strategic Plan</h1>
          <p className="text-muted-foreground text-sm mt-1">{completedGoals}/{totalGoals} goals completed · {avgProgress}% average progress</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
          <Plus size={16} /> Add Goal
        </button>
      </div>

      {/* Summary bar */}
      {totalGoals > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm font-semibold text-primary">{avgProgress}%</span>
          </div>
          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${avgProgress}%` }} />
          </div>
          <div className="flex gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const count = goals.filter(g => g.status === key).length;
              if (!count) return null;
              return <span key={key} className={`px-2 py-0.5 rounded-full ${cfg.color}`}>{count} {cfg.label}</span>;
            })}
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSave} className="bg-card border border-border rounded-xl p-5 mb-6">
          <h3 className="font-semibold mb-4">Add Strategic Goal</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Strategic Pillar *</label>
              <input required value={form.pillar} onChange={e => setForm({...form, pillar: e.target.value})}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g. Community Impact" list="pillars-list" />
              <datalist id="pillars-list">{pillars.map(p => <option key={p} value={p} />)}</datalist>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Goal *</label>
              <input required value={form.goal} onChange={e => setForm({...form, goal: e.target.value})}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none resize-none" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Owner</label>
              <input value={form.owner} onChange={e => setForm({...form, owner: e.target.value})}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Target Date</label>
              <input type="date" value={form.target_date} onChange={e => setForm({...form, target_date: e.target.value})}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="button" onClick={() => setShowForm(false)} className="border border-border px-4 py-2 rounded-lg text-sm hover:bg-muted transition">Cancel</button>
            <button type="submit" disabled={saving} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-60">
              {saving ? "Saving..." : "Add Goal"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-8">
          {pillars.length > 0 ? pillars.map(pillar => {
            const pillarGoals = goals.filter(g => g.pillar === pillar);
            return (
              <div key={pillar}>
                <h2 className="font-heading font-semibold text-lg mb-3 flex items-center gap-2">
                  <Target size={16} className="text-primary" /> {pillar}
                </h2>
                <div className="space-y-3">
                  {pillarGoals.map(goal => {
                    const expanded = expandedGoals[goal.id];
                    const statusCfg = STATUS_CONFIG[goal.status] || STATUS_CONFIG.not_started;
                    return (
                      <div key={goal.id} className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="p-4 flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm">{goal.goal}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${statusCfg.color}`}>{statusCfg.label}</span>
                            </div>
                            {goal.description && <p className="text-xs text-muted-foreground mt-1">{goal.description}</p>}
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-muted-foreground">{goal.owner ? `Owner: ${goal.owner}` : ""}</span>
                                <span className="font-medium">{goal.progress_percent || 0}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${goal.progress_percent || 0}%` }} />
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <button onClick={() => setExpandedGoals(prev => ({ ...prev, [goal.id]: !expanded }))} className="p-1.5 text-muted-foreground hover:text-foreground">
                              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            </button>
                            <button onClick={() => handleDelete(goal.id)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                          </div>
                        </div>
                        {expanded && (
                          <div className="px-4 pb-4 border-t border-border pt-3 grid sm:grid-cols-3 gap-3">
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                              <select value={goal.status} onChange={e => updateGoal(goal.id, { status: e.target.value })}
                                className="w-full text-sm border border-input rounded-lg px-3 py-1.5 bg-background focus:outline-none">
                                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Progress %</label>
                              <input type="number" min="0" max="100" value={goal.progress_percent || 0}
                                onChange={e => updateGoal(goal.id, { progress_percent: Number(e.target.value) })}
                                className="w-full text-sm border border-input rounded-lg px-3 py-1.5 bg-background focus:outline-none" />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Updates / Notes</label>
                              <input value={goal.updates || ""} onChange={e => updateGoal(goal.id, { updates: e.target.value })}
                                className="w-full text-sm border border-input rounded-lg px-3 py-1.5 bg-background focus:outline-none"
                                placeholder="Latest update..." />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }) : (
            goals.length > 0 ? (
              <div className="space-y-3">
                {goals.map(goal => (
                  <div key={goal.id} className="bg-card border border-border rounded-xl p-4">
                    <p className="font-semibold text-sm">{goal.goal}</p>
                    <p className="text-xs text-muted-foreground">{goal.pillar}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Target size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No strategic goals yet</p>
                <p className="text-sm">Add your first goal to get started.</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
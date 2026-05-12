import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, BookOpen, CheckCircle, Circle, ExternalLink, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "orientation", label: "Orientation", emoji: "👋" },
  { value: "governance", label: "Governance", emoji: "⚖️" },
  { value: "financial_oversight", label: "Financial Oversight", emoji: "💰" },
  { value: "legal_compliance", label: "Legal & Compliance", emoji: "📋" },
  { value: "nonprofit_law", label: "Nonprofit Law (Alberta)", emoji: "🏛️" },
  { value: "strategic_planning", label: "Strategic Planning", emoji: "🎯" },
  { value: "board_culture", label: "Board Culture", emoji: "🤝" },
  { value: "other", label: "Other", emoji: "📁" },
];

const ONBOARDING_CHECKLIST = [
  "Welcome email sent",
  "Board member agreement signed",
  "Conflict of interest declaration completed",
  "D&O insurance acknowledged",
  "Access to board portal provided",
  "Introduction to staff completed",
  "Strategic plan reviewed",
  "Bylaws reviewed",
  "First meeting attended",
];

export default function Onboarding() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", category: "orientation", resource_type: "document", description: "", external_url: "", is_required: false });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [checklist, setChecklist] = useState({});

  const load = async () => {
    const data = await base44.entities.TrainingResource.list("order_index");
    setResources(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const saved = await base44.entities.TrainingResource.create({ ...form, order_index: resources.length });
    setResources(prev => [...prev, saved]);
    setForm({ title: "", category: "orientation", resource_type: "document", description: "", external_url: "", is_required: false });
    setShowForm(false);
    setSaving(false);
    toast.success("Resource added");
  };

  const handleFileUpload = async (e, formData) => {
    const file = e.target.files?.[0];
    if (!file || !formData.title) { toast.error("Please enter a title first"); return; }
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const saved = await base44.entities.TrainingResource.create({ ...formData, file_url, file_name: file.name, order_index: resources.length });
    setResources(prev => [...prev, saved]);
    setShowForm(false);
    setUploading(false);
    toast.success("Resource uploaded");
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this resource?")) return;
    await base44.entities.TrainingResource.delete(id);
    setResources(prev => prev.filter(r => r.id !== id));
  };

  const filtered = activeCategory === "all" ? resources : resources.filter(r => r.category === activeCategory);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Board Onboarding</h1>
          <p className="text-muted-foreground text-sm mt-1">Training resources and onboarding materials for board members</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
          <Plus size={16} /> Add Resource
        </button>
      </div>

      {/* Onboarding Checklist */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h2 className="font-heading font-semibold mb-4">New Member Onboarding Checklist</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {ONBOARDING_CHECKLIST.map(item => (
            <button key={item} onClick={() => setChecklist(prev => ({ ...prev, [item]: !prev[item] }))}
              className={`flex items-center gap-2.5 text-left px-3 py-2 rounded-lg border transition text-sm ${checklist[item] ? "bg-green-50 border-green-200 text-green-800" : "border-border hover:bg-muted text-foreground"}`}>
              {checklist[item] ? <CheckCircle size={15} className="text-green-600 shrink-0" /> : <Circle size={15} className="text-muted-foreground shrink-0" />}
              {item}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">{Object.values(checklist).filter(Boolean).length} of {ONBOARDING_CHECKLIST.length} items completed</p>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-card border border-border rounded-xl p-5 mb-6">
          <h3 className="font-semibold mb-4">Add Training Resource</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Title *</label>
              <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Category</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Type</label>
              <select value={form.resource_type} onChange={e => setForm({...form, resource_type: e.target.value})}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none">
                {["document","video","link","policy","checklist"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">External URL (optional)</label>
              <input value={form.external_url} onChange={e => setForm({...form, external_url: e.target.value})}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none"
                placeholder="https://..." />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none resize-none" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="required" checked={form.is_required} onChange={e => setForm({...form, is_required: e.target.checked})} />
              <label htmlFor="required" className="text-sm">Required for all new members</label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="button" onClick={() => setShowForm(false)} className="border border-border px-4 py-2 rounded-lg text-sm hover:bg-muted transition">Cancel</button>
            <button type="submit" disabled={saving} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-60">
              {saving ? "Saving..." : "Save Resource"}
            </button>
            <label className={`flex items-center gap-2 cursor-pointer border border-border px-4 py-2 rounded-lg text-sm hover:bg-muted transition ${uploading ? "opacity-60" : ""}`}>
              <Upload size={13} /> {uploading ? "Uploading..." : "Upload File Instead"}
              <input type="file" className="hidden" onChange={e => handleFileUpload(e, form)} disabled={uploading} />
            </label>
          </div>
        </form>
      )}

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-5">
        <button onClick={() => setActiveCategory("all")}
          className={`text-xs px-3 py-1.5 rounded-full border transition ${activeCategory === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>
          All Resources
        </button>
        {CATEGORIES.map(c => (
          <button key={c.value} onClick={() => setActiveCategory(c.value)}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${activeCategory === c.value ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(resource => {
            const cat = CATEGORIES.find(c => c.value === resource.category);
            return (
              <div key={resource.id} className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition group">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xl">{cat?.emoji || "📁"}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    {(resource.external_url || resource.file_url) && (
                      <a href={resource.external_url || resource.file_url} target="_blank" rel="noreferrer" className="p-1.5 text-muted-foreground hover:text-foreground">
                        <ExternalLink size={13} />
                      </a>
                    )}
                    <button onClick={() => handleDelete(resource.id)} className="p-1.5 text-muted-foreground hover:text-destructive">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-sm mb-1">{resource.title}</h3>
                {resource.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{resource.description}</p>}
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{cat?.label}</span>
                  <span className="text-xs text-muted-foreground">{resource.resource_type}</span>
                  {resource.is_required && <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Required</span>}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-12 text-muted-foreground">
              <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
              <p>No resources in this category yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";

export default function NewMeetingModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    title: "",
    meeting_date: "",
    location: "",
    meeting_type: "Regular Board Meeting",
    status: "upcoming",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const saved = await base44.entities.Meeting.create(form);
    onSaved(saved);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-heading font-semibold text-lg">Schedule Meeting</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Meeting Title *</label>
            <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. Regular Board Meeting – June 2026" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Date & Time *</label>
            <input required type="datetime-local" value={form.meeting_date} onChange={e => setForm({...form, meeting_date: e.target.value})}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Location / Video Link</label>
            <input value={form.location} onChange={e => setForm({...form, location: e.target.value})}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Board Room / Zoom link" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Meeting Type</label>
            <select value={form.meeting_type} onChange={e => setForm({...form, meeting_type: e.target.value})}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
              {["Regular Board Meeting","Special Meeting","AGM","In Camera","Committee Meeting"].map(t => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-border rounded-lg py-2 text-sm hover:bg-muted transition">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-60">
              {saving ? "Saving..." : "Schedule Meeting"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
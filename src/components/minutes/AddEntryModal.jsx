import { useState } from "react";
import { X } from "lucide-react";

const ENTRY_TYPES = [
  { value: "motion", label: "Motion", desc: "A formal motion with mover, seconder, and result" },
  { value: "resolution", label: "Resolution", desc: "A board resolution" },
  { value: "action_item", label: "Action Item", desc: "Task assigned to a person" },
  { value: "discussion", label: "Discussion", desc: "Key points of discussion" },
  { value: "information", label: "Information", desc: "Information presented to the board" },
  { value: "dissent", label: "Dissent", desc: "Recorded dissent or disagreement" },
  { value: "abstention", label: "Abstention", desc: "Recorded abstention from vote" },
  { value: "in_camera", label: "In Camera", desc: "Private/confidential discussion" },
  { value: "note", label: "General Note", desc: "General note or comment" },
];

export default function AddEntryModal({ agendaItemId, members, onSave, onClose }) {
  const [selectedType, setSelectedType] = useState(null);
  const [form, setForm] = useState({
    entry_type: "",
    content: "",
    motion_verbiage: "",
    moved_by: "",
    seconded_by: "",
    motion_result: "",
    action_assigned_to: "",
    action_due_date: "",
    is_in_camera: false,
  });

  const selectType = (type) => {
    setSelectedType(type);
    setForm(f => ({ ...f, entry_type: type.value, is_in_camera: type.value === "in_camera" }));
  };

  const handleSave = () => {
    onSave({ ...form, agenda_item_id: agendaItemId });
  };

  const memberNames = members.map(m => m.full_name);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
          <h2 className="font-heading font-semibold">Add Minute Entry</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        {!selectedType ? (
          <div className="p-5">
            <p className="text-sm text-muted-foreground mb-4">Select the type of entry to add:</p>
            <div className="grid gap-2">
              {ENTRY_TYPES.map(type => (
                <button key={type.value} onClick={() => selectType(type)}
                  className="text-left px-4 py-3 rounded-xl border border-border hover:bg-muted hover:border-primary/30 transition">
                  <p className="font-medium text-sm">{type.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{type.desc}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">{selectedType.label}</span>
              <button onClick={() => setSelectedType(null)} className="text-xs text-muted-foreground hover:text-foreground">← Change type</button>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">
                {selectedType.value === "motion" ? "Summary / Notes" : "Content"}
              </label>
              <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} rows={3}
                className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                placeholder="Enter details..." />
            </div>

            {selectedType.value === "motion" && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Motion Verbiage</label>
                  <textarea value={form.motion_verbiage} onChange={e => setForm({...form, motion_verbiage: e.target.value})} rows={3}
                    className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                    placeholder="THAT the board approves..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Moved By</label>
                    <select value={form.moved_by} onChange={e => setForm({...form, moved_by: e.target.value})}
                      className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none">
                      <option value="">Select...</option>
                      {memberNames.map(n => <option key={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Seconded By</label>
                    <select value={form.seconded_by} onChange={e => setForm({...form, seconded_by: e.target.value})}
                      className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none">
                      <option value="">Select...</option>
                      {memberNames.map(n => <option key={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Result</label>
                  <div className="flex gap-2">
                    {["carried", "defeated", "tabled", "withdrawn"].map(r => (
                      <button key={r} onClick={() => setForm({...form, motion_result: r})}
                        className={`flex-1 py-2 rounded-lg text-sm border transition ${form.motion_result === r ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {selectedType.value === "action_item" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Assigned To</label>
                  <select value={form.action_assigned_to} onChange={e => setForm({...form, action_assigned_to: e.target.value})}
                    className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none">
                    <option value="">Select...</option>
                    {memberNames.map(n => <option key={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Due Date</label>
                  <input type="date" value={form.action_due_date} onChange={e => setForm({...form, action_due_date: e.target.value})}
                    className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none" />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input type="checkbox" id="incam" checked={form.is_in_camera} onChange={e => setForm({...form, is_in_camera: e.target.checked})} />
              <label htmlFor="incam" className="text-sm">Mark as In Camera (confidential)</label>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="flex-1 border border-border rounded-lg py-2 text-sm hover:bg-muted transition">Cancel</button>
              <button onClick={handleSave} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:opacity-90 transition">Add Entry</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
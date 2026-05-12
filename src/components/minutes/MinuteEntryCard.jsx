import { useState } from "react";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";

const TYPE_COLORS = {
  motion: "bg-blue-50 border-blue-200 text-blue-800",
  resolution: "bg-purple-50 border-purple-200 text-purple-800",
  action_item: "bg-orange-50 border-orange-200 text-orange-800",
  discussion: "bg-gray-50 border-gray-200 text-gray-700",
  information: "bg-teal-50 border-teal-200 text-teal-800",
  dissent: "bg-red-50 border-red-200 text-red-800",
  abstention: "bg-yellow-50 border-yellow-200 text-yellow-800",
  in_camera: "bg-amber-50 border-amber-200 text-amber-800",
  note: "bg-gray-50 border-gray-200 text-gray-700",
};

export default function MinuteEntryCard({ entry, members, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  const Field = ({ label, field, type = "text", options }) => (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      {options ? (
        <select value={entry[field] || ""} onChange={e => onUpdate({ [field]: e.target.value })}
          className="w-full text-sm border border-input rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring">
          <option value="">Select...</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={entry[field] || ""} onChange={e => onUpdate({ [field]: e.target.value })}
          className="w-full text-sm border border-input rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
      )}
    </div>
  );

  const memberNames = members.map(m => m.full_name);

  return (
    <div className={`border rounded-lg overflow-hidden ${TYPE_COLORS[entry.entry_type] || TYPE_COLORS.note}`}>
      <div className="px-4 py-3 flex items-start gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider shrink-0 mt-0.5 opacity-70">
          {entry.entry_type?.replace(/_/g, " ")}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm">{entry.content || entry.motion_verbiage || <span className="opacity-50 italic">No content</span>}</p>
          {entry.entry_type === "motion" && (
            <p className="text-xs mt-1 opacity-70">
              Moved: {entry.moved_by || "—"} · Seconded: {entry.seconded_by || "—"} · Result: <strong>{entry.motion_result || "pending"}</strong>
            </p>
          )}
          {entry.entry_type === "action_item" && entry.action_assigned_to && (
            <p className="text-xs mt-1 opacity-70">Assigned to: {entry.action_assigned_to}{entry.action_due_date ? ` · Due: ${entry.action_due_date}` : ""}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={() => setExpanded(!expanded)} className="opacity-60 hover:opacity-100">
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          <button onClick={onDelete} className="opacity-60 hover:opacity-100 hover:text-destructive"><Trash2 size={14} /></button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-current/10 space-y-3 bg-white/50">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Content / Notes</label>
            <textarea value={entry.content || ""} onChange={e => onUpdate({ content: e.target.value })} rows={3}
              className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
          </div>

          {entry.entry_type === "motion" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Motion Verbiage</label>
                <textarea value={entry.motion_verbiage || ""} onChange={e => onUpdate({ motion_verbiage: e.target.value })} rows={2}
                  className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
              </div>
              <div className="space-y-2">
                <Field label="Moved By" field="moved_by" options={memberNames} />
                <Field label="Seconded By" field="seconded_by" options={memberNames} />
                <Field label="Result" field="motion_result" options={["carried", "defeated", "tabled", "withdrawn"]} />
              </div>
            </div>
          )}

          {entry.entry_type === "action_item" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Assigned To" field="action_assigned_to" options={memberNames} />
              <Field label="Due Date" field="action_due_date" type="date" />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input type="checkbox" id={`incam_${entry.id}`} checked={entry.is_in_camera || false}
              onChange={e => onUpdate({ is_in_camera: e.target.checked })} className="rounded" />
            <label htmlFor={`incam_${entry.id}`} className="text-xs">In Camera (hidden from public minutes)</label>
          </div>
        </div>
      )}
    </div>
  );
}
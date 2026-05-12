import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, GripVertical, Trash2, Wand2, Send, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const TEMPLATE_ITEMS = [
  { title: "Call to Order", item_type: "call_to_order", duration_minutes: 2, is_enabled: true },
  { title: "Approval of Agenda", item_type: "approval_of_agenda", duration_minutes: 3, is_enabled: true },
  { title: "Approval of Previous Minutes", item_type: "approval_of_minutes", duration_minutes: 5, is_enabled: true },
  { title: "Business Arising from Previous Minutes", item_type: "business_arising", duration_minutes: 10, is_enabled: true },
  { title: "Executive Director Report", item_type: "reports", duration_minutes: 15, is_enabled: true },
  { title: "Financial Report", item_type: "reports", duration_minutes: 10, is_enabled: true },
  { title: "Committee Reports", item_type: "reports", duration_minutes: 10, is_enabled: false },
  { title: "New Business", item_type: "new_business", duration_minutes: 20, is_enabled: true },
  { title: "In Camera Session", item_type: "in_camera", duration_minutes: 15, is_enabled: false, is_in_camera: true },
  { title: "Adjournment", item_type: "adjournment", duration_minutes: 2, is_enabled: true },
];

export default function AgendaBuilder() {
  const { id } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.Meeting.filter({ id }),
      base44.entities.AgendaItem.filter({ meeting_id: id }, "order_index"),
      base44.entities.BoardMember.filter({ status: "active" }),
    ]).then(([meetings, agendaItems, boardMembers]) => {
      setMeeting(meetings[0]);
      if (agendaItems.length === 0) {
        setItems(TEMPLATE_ITEMS.map((item, i) => ({ ...item, order_index: i, meeting_id: id, _unsaved: true, _tempId: `temp_${i}` })));
      } else {
        setItems(agendaItems);
      }
      setMembers(boardMembers);
      setLoading(false);
    });
  }, [id]);

  const saveAll = async () => {
    const toSave = items.filter(i => i._unsaved);
    const saved = await Promise.all(
      toSave.map(item => {
        const { _unsaved, _tempId, ...data } = item;
        return base44.entities.AgendaItem.create({ ...data, meeting_id: id });
      })
    );
    const updatedItems = items.map(item => {
      if (item._unsaved) {
        const matchIdx = toSave.findIndex(s => s._tempId === item._tempId);
        return matchIdx >= 0 ? saved[matchIdx] : item;
      }
      return item;
    });
    setItems(updatedItems);
    toast.success("Agenda saved");
  };

  const addItem = () => {
    const newItem = {
      title: "New Agenda Item",
      item_type: "other",
      duration_minutes: 10,
      is_enabled: true,
      is_in_camera: false,
      order_index: items.length,
      meeting_id: id,
      _unsaved: true,
      _tempId: `temp_${Date.now()}`,
    };
    setItems(prev => [...prev, newItem]);
  };

  const updateItem = (idx, field, value) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: value };
      if (!item._unsaved && item.id) {
        base44.entities.AgendaItem.update(item.id, { [field]: value }).catch(console.error);
      }
      return updated;
    }));
  };

  const removeItem = async (idx) => {
    const item = items[idx];
    if (!item._unsaved && item.id) await base44.entities.AgendaItem.delete(item.id);
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const autoGenerate = async () => {
    setGenerating(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a professional board meeting agenda for a nonprofit organization. Meeting: "${meeting?.title}" on ${format(new Date(meeting?.meeting_date || new Date()), "MMMM d, yyyy")}. Return a JSON array of agenda items each with: title, description, item_type (one of: call_to_order, approval_of_agenda, approval_of_minutes, business_arising, new_business, reports, in_camera, adjournment, other), duration_minutes (number), presenter (optional string). Make it detailed and formal.`,
      response_json_schema: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                item_type: { type: "string" },
                duration_minutes: { type: "number" },
                presenter: { type: "string" },
              }
            }
          }
        }
      }
    });
    const generated = (result.items || []).map((item, i) => ({
      ...item, is_enabled: true, is_in_camera: item.item_type === "in_camera",
      order_index: i, meeting_id: id, _unsaved: true, _tempId: `gen_${i}`,
    }));
    setItems(generated);
    setGenerating(false);
    toast.success("Agenda generated! Review and save.");
  };

  const sendToMembers = async () => {
    if (!members.length) { toast.error("No board members found."); return; }
    setSending(true);
    const enabledItems = items.filter(i => i.is_enabled && !i.is_in_camera);
    const agendaText = enabledItems.map((item, i) =>
      `${i + 1}. ${item.title}${item.duration_minutes ? ` (${item.duration_minutes} min)` : ""}${item.presenter ? ` – ${item.presenter}` : ""}`
    ).join("\n");

    const totalMin = enabledItems.reduce((s, i) => s + (i.duration_minutes || 0), 0);
    const subject = `Board Meeting Agenda – ${meeting?.title} – ${format(new Date(meeting?.meeting_date || new Date()), "MMMM d, yyyy")}`;
    const body = `Dear Board Member,\n\nPlease find the agenda for the upcoming meeting below.\n\nMeeting: ${meeting?.title}\nDate: ${format(new Date(meeting?.meeting_date || new Date()), "EEEE, MMMM d, yyyy 'at' h:mm a")}\nLocation: ${meeting?.location || "TBD"}\nEstimated Duration: ${totalMin} minutes\n\nAGENDA\n──────────────────────\n${agendaText}\n\nPlease review the materials in advance.\n\nThank you,\nBoard Administration`;

    await Promise.all(
      members.filter(m => m.email).map(m =>
        base44.integrations.Core.SendEmail({ to: m.email, subject, body })
      )
    );
    setSending(false);
    toast.success(`Agenda sent to ${members.length} board members!`);
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div>;

  const totalMin = items.filter(i => i.is_enabled).reduce((s, i) => s + (i.duration_minutes || 0), 0);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold">Agenda Builder</h1>
        <p className="text-muted-foreground text-sm mt-1">{meeting?.title} · {meeting?.meeting_date && format(new Date(meeting.meeting_date), "MMMM d, yyyy 'at' h:mm a")}</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={autoGenerate} disabled={generating} className="flex items-center gap-2 border border-border bg-card px-4 py-2 rounded-lg text-sm hover:bg-muted transition disabled:opacity-60">
          <Wand2 size={15} /> {generating ? "Generating..." : "AI Auto-Generate"}
        </button>
        <button onClick={saveAll} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm hover:opacity-90 transition">
          Save Agenda
        </button>
        <button onClick={sendToMembers} disabled={sending} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 transition disabled:opacity-60">
          <Send size={15} /> {sending ? "Sending..." : "Send to Board Members"}
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-sm font-medium">Agenda Items</span>
          <span className="text-xs text-muted-foreground">{totalMin} min estimated · {items.filter(i => i.is_enabled).length} items active</span>
        </div>

        <div className="divide-y divide-border">
          {items.map((item, idx) => (
            <div key={item.id || item._tempId} className={`p-4 flex items-start gap-3 ${!item.is_enabled ? "opacity-50" : ""}`}>
              <div className="mt-1 text-muted-foreground"><GripVertical size={16} /></div>
              <div className="flex-1 space-y-2">
                <input
                  value={item.title}
                  onChange={e => updateItem(idx, "title", e.target.value)}
                  className="w-full text-sm font-medium bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-ring rounded px-1 -ml-1"
                />
                <div className="flex flex-wrap gap-2">
                  <select value={item.item_type} onChange={e => updateItem(idx, "item_type", e.target.value)}
                    className="text-xs border border-input rounded px-2 py-1 bg-background">
                    {["call_to_order","approval_of_agenda","approval_of_minutes","business_arising","new_business","reports","in_camera","adjournment","other"].map(t => (
                      <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                  <input type="number" value={item.duration_minutes || ""} onChange={e => updateItem(idx, "duration_minutes", Number(e.target.value))}
                    className="text-xs border border-input rounded px-2 py-1 bg-background w-20" placeholder="min" />
                  <input value={item.presenter || ""} onChange={e => updateItem(idx, "presenter", e.target.value)}
                    className="text-xs border border-input rounded px-2 py-1 bg-background" placeholder="Presenter" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <button onClick={() => updateItem(idx, "is_in_camera", !item.is_in_camera)} title="In Camera"
                  className={`p-1.5 rounded ${item.is_in_camera ? "bg-amber-100 text-amber-700" : "text-muted-foreground hover:text-foreground"}`}>
                  {item.is_in_camera ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={() => updateItem(idx, "is_enabled", !item.is_enabled)}
                  className={`p-1.5 rounded text-xs font-medium ${item.is_enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {item.is_enabled ? "ON" : "OFF"}
                </button>
                <button onClick={() => removeItem(idx)} className="p-1.5 text-muted-foreground hover:text-destructive rounded">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={addItem} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-dashed border-border rounded-lg px-4 py-2.5 w-full justify-center hover:bg-muted transition">
        <Plus size={15} /> Add Agenda Item
      </button>
    </div>
  );
}
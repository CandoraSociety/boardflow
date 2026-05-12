import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, FileDown, Eye, EyeOff, Lock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import MinuteEntryCard from "@/components/minutes/MinuteEntryCard";
import AddEntryModal from "@/components/minutes/AddEntryModal";
import GenerateMinutesModal from "@/components/minutes/GenerateMinutesModal";

export default function MinutesTaker() {
  const { id } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [agendaItems, setAgendaItems] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInCamera, setShowInCamera] = useState(false);
  const [addModal, setAddModal] = useState(null); // { agenda_item_id }
  const [showGenerate, setShowGenerate] = useState(false);
  const [members, setMembers] = useState([]);

  const load = async () => {
    const [meetings, items, minuteEntries, boardMembers] = await Promise.all([
      base44.entities.Meeting.filter({ id }),
      base44.entities.AgendaItem.filter({ meeting_id: id }, "order_index"),
      base44.entities.MinuteEntry.filter({ meeting_id: id }, "order_index"),
      base44.entities.BoardMember.filter({ status: "active" }),
    ]);
    setMeeting(meetings[0]);
    setAgendaItems(items);
    setEntries(minuteEntries);
    setMembers(boardMembers);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handleAddEntry = async (entryData) => {
    const saved = await base44.entities.MinuteEntry.create({ ...entryData, meeting_id: id });
    setEntries(prev => [...prev, saved]);
    setAddModal(null);
  };

  const handleUpdateEntry = async (entryId, updates) => {
    await base44.entities.MinuteEntry.update(entryId, updates);
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, ...updates } : e));
  };

  const handleDeleteEntry = async (entryId) => {
    await base44.entities.MinuteEntry.delete(entryId);
    setEntries(prev => prev.filter(e => e.id !== entryId));
  };

  const updateMeeting = async (updates) => {
    await base44.entities.Meeting.update(id, updates);
    setMeeting(prev => ({ ...prev, ...updates }));
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div>;

  const visibleItems = showInCamera ? agendaItems : agendaItems.filter(a => !a.is_in_camera);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Minutes</h1>
          <p className="text-muted-foreground text-sm mt-1">{meeting?.title} · {meeting?.meeting_date && format(new Date(meeting.meeting_date), "MMMM d, yyyy")}</p>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap justify-end">
          <button onClick={() => setShowInCamera(!showInCamera)}
            className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border transition ${showInCamera ? "bg-amber-50 border-amber-300 text-amber-700" : "border-border text-muted-foreground hover:bg-muted"}`}>
            {showInCamera ? <Eye size={14} /> : <EyeOff size={14} />}
            {showInCamera ? "Showing In Camera" : "In Camera Hidden"}
          </button>
          <button onClick={() => setShowGenerate(true)} className="flex items-center gap-2 bg-primary text-primary-foreground text-sm px-4 py-2 rounded-lg hover:opacity-90 transition">
            <FileDown size={14} /> Generate Minutes
          </button>
        </div>
      </div>

      {/* Meeting header fields */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6 grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Chair</label>
          <input value={meeting?.chair || ""} onChange={e => updateMeeting({ chair: e.target.value })}
            className="mt-1 w-full text-sm border-0 border-b border-border bg-transparent focus:outline-none focus:border-primary pb-1"
            placeholder="Enter chair name" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recording Secretary</label>
          <input value={meeting?.recording_secretary || ""} onChange={e => updateMeeting({ recording_secretary: e.target.value })}
            className="mt-1 w-full text-sm border-0 border-b border-border bg-transparent focus:outline-none focus:border-primary pb-1"
            placeholder="Enter secretary name" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Attendees</label>
          <input value={meeting?.attendees?.join(", ") || ""} onChange={e => updateMeeting({ attendees: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
            className="mt-1 w-full text-sm border-0 border-b border-border bg-transparent focus:outline-none focus:border-primary pb-1"
            placeholder="Enter names separated by commas" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Regrets/Apologies</label>
          <input value={meeting?.apologies?.join(", ") || ""} onChange={e => updateMeeting({ apologies: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
            className="mt-1 w-full text-sm border-0 border-b border-border bg-transparent focus:outline-none focus:border-primary pb-1"
            placeholder="Enter names" />
        </div>
        <div className="flex items-center gap-2 pt-4">
          <input type="checkbox" id="quorum" checked={meeting?.quorum_met || false} onChange={e => updateMeeting({ quorum_met: e.target.checked })}
            className="rounded border-input" />
          <label htmlFor="quorum" className="text-sm">Quorum Met</label>
        </div>
      </div>

      {/* Agenda items with minute entries */}
      <div className="space-y-6">
        {visibleItems.length === 0 && (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
            <p>No agenda items found. Build the agenda first.</p>
          </div>
        )}

        {visibleItems.map(agendaItem => {
          const itemEntries = entries.filter(e => e.agenda_item_id === agendaItem.id);
          const isInCamera = agendaItem.is_in_camera;
          return (
            <div key={agendaItem.id} className={`bg-card border rounded-xl overflow-hidden ${isInCamera ? "border-amber-300" : "border-border"}`}>
              <div className={`px-5 py-3 flex items-center justify-between ${isInCamera ? "bg-amber-50 border-b border-amber-200" : "bg-muted/30 border-b border-border"}`}>
                <div className="flex items-center gap-2">
                  {isInCamera && <Lock size={14} className="text-amber-600" />}
                  <span className="font-semibold text-sm">{agendaItem.title}</span>
                  <span className="text-xs text-muted-foreground">{agendaItem.item_type?.replace(/_/g, " ")}</span>
                </div>
                <button onClick={() => setAddModal({ agenda_item_id: agendaItem.id })}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border px-2.5 py-1.5 rounded-lg hover:bg-background transition">
                  <Plus size={12} /> Add Entry
                </button>
              </div>
              <div className="p-4 space-y-3">
                {itemEntries.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No entries yet. Click "Add Entry" to begin.</p>
                ) : (
                  itemEntries.map(entry => (
                    <MinuteEntryCard key={entry.id} entry={entry} members={members}
                      onUpdate={(updates) => handleUpdateEntry(entry.id, updates)}
                      onDelete={() => handleDeleteEntry(entry.id)} />
                  ))
                )}
              </div>
            </div>
          );
        })}

        {/* General entries not attached to agenda items */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
            <span className="font-semibold text-sm">General / Other Notes</span>
            <button onClick={() => setAddModal({ agenda_item_id: null })}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border px-2.5 py-1.5 rounded-lg hover:bg-background transition">
              <Plus size={12} /> Add Entry
            </button>
          </div>
          <div className="p-4 space-y-3">
            {entries.filter(e => !e.agenda_item_id).map(entry => (
              <MinuteEntryCard key={entry.id} entry={entry} members={members}
                onUpdate={(updates) => handleUpdateEntry(entry.id, updates)}
                onDelete={() => handleDeleteEntry(entry.id)} />
            ))}
            {entries.filter(e => !e.agenda_item_id).length === 0 && (
              <p className="text-xs text-muted-foreground italic">No general entries yet.</p>
            )}
          </div>
        </div>
      </div>

      {addModal && (
        <AddEntryModal
          agendaItemId={addModal.agenda_item_id}
          members={members}
          onSave={handleAddEntry}
          onClose={() => setAddModal(null)}
        />
      )}

      {showGenerate && (
        <GenerateMinutesModal
          meeting={meeting}
          agendaItems={agendaItems}
          entries={entries}
          showInCamera={showInCamera}
          onClose={() => setShowGenerate(false)}
        />
      )}
    </div>
  );
}
import { useState } from "react";
import { X, Download } from "lucide-react";
import { format } from "date-fns";

export default function GenerateMinutesModal({ meeting, agendaItems, entries, showInCamera, onClose }) {
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState(null);

  const generateDoc = async () => {
    setGenerating(true);
    const visibleEntries = showInCamera ? entries : entries.filter(e => !e.is_in_camera);
    const visibleItems = showInCamera ? agendaItems : agendaItems.filter(a => !a.is_in_camera);

    let content = `MINUTES OF THE ${(meeting?.meeting_type || "BOARD MEETING").toUpperCase()}\n`;
    content += `${meeting?.title}\n`;
    content += `${"=".repeat(60)}\n\n`;
    content += `Date: ${format(new Date(meeting?.meeting_date || new Date()), "EEEE, MMMM d, yyyy 'at' h:mm a")}\n`;
    content += `Location: ${meeting?.location || "TBD"}\n`;
    if (meeting?.chair) content += `Chair: ${meeting.chair}\n`;
    if (meeting?.recording_secretary) content += `Recording Secretary: ${meeting.recording_secretary}\n`;
    content += `Quorum Met: ${meeting?.quorum_met ? "Yes" : "No"}\n`;
    if (meeting?.attendees?.length) content += `\nATTENDANCE\nPresent: ${Array.isArray(meeting.attendees) ? meeting.attendees.join(", ") : meeting.attendees}\n`;
    if (meeting?.apologies?.length) content += `Regrets: ${Array.isArray(meeting.apologies) ? meeting.apologies.join(", ") : meeting.apologies}\n`;

    content += `\n${"─".repeat(60)}\n\n`;

    visibleItems.forEach((item, idx) => {
      const itemEntries = visibleEntries.filter(e => e.agenda_item_id === item.id);
      content += `${idx + 1}. ${item.title.toUpperCase()}\n`;
      if (item.description) content += `${item.description}\n`;

      itemEntries.forEach(entry => {
        content += `\n`;
        switch (entry.entry_type) {
          case "motion":
            content += `  MOTION: ${entry.motion_verbiage || entry.content || ""}\n`;
            content += `  Moved by: ${entry.moved_by || "—"}  |  Seconded by: ${entry.seconded_by || "—"}\n`;
            content += `  Result: ${(entry.motion_result || "pending").toUpperCase()}\n`;
            break;
          case "resolution":
            content += `  RESOLUTION: ${entry.content || ""}\n`;
            break;
          case "action_item":
            content += `  ACTION ITEM: ${entry.content || ""}\n`;
            if (entry.action_assigned_to) content += `  Assigned to: ${entry.action_assigned_to}${entry.action_due_date ? `  |  Due: ${entry.action_due_date}` : ""}\n`;
            break;
          case "dissent":
            content += `  DISSENT: ${entry.content || ""}\n`;
            break;
          case "abstention":
            content += `  ABSTENTION: ${entry.content || ""}\n`;
            break;
          case "information":
            content += `  INFORMATION: ${entry.content || ""}\n`;
            break;
          case "discussion":
            content += `  DISCUSSION: ${entry.content || ""}\n`;
            break;
          default:
            content += `  ${entry.content || ""}\n`;
        }
      });
      content += `\n`;
    });

    const generalEntries = visibleEntries.filter(e => !e.agenda_item_id);
    if (generalEntries.length) {
      content += `GENERAL NOTES\n`;
      generalEntries.forEach(e => { content += `  ${e.content || ""}\n`; });
      content += `\n`;
    }

    content += `${"─".repeat(60)}\n`;
    content += `\nSIGNATURES\n\n`;
    content += `Chair: __________________________ Date: __________\n\n`;
    content += `Secretary: ______________________ Date: __________\n`;

    setPreview(content);
    setGenerating(false);
  };

  const downloadTxt = () => {
    const blob = new Blob([preview], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Minutes_${meeting?.title?.replace(/\s+/g, "_")}_${format(new Date(meeting?.meeting_date || new Date()), "yyyy-MM-dd")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-heading font-semibold">Generate Minutes Document</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {!preview ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm mb-6">Generate a formatted minutes document based on your entries.</p>
              {!showInCamera && <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-6">In Camera items are currently hidden and will be excluded from the document.</p>}
              <button onClick={generateDoc} disabled={generating} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-60">
                {generating ? "Generating..." : "Generate Minutes"}
              </button>
            </div>
          ) : (
            <div>
              <pre className="text-xs font-mono bg-muted rounded-xl p-4 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">{preview}</pre>
              <div className="flex gap-3 mt-4">
                <button onClick={downloadTxt} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
                  <Download size={14} /> Download .txt
                </button>
                <button onClick={() => setPreview(null)} className="border border-border px-4 py-2 rounded-lg text-sm hover:bg-muted transition">Regenerate</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
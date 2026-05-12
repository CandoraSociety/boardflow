import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Send, MessageSquare, Sparkles, BookOpen, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";

const PRESET_QUESTIONS = [
  { category: "Alberta Law", q: "In Alberta, can a nonprofit board member receive compensation?" },
  { category: "Alberta Law", q: "What are the AGM requirements for nonprofits in Alberta?" },
  { category: "Alberta Law", q: "What are the director duties under the Alberta Companies Act?" },
  { category: "Alberta Law", q: "Can a nonprofit in Alberta operate a commercial enterprise?" },
  { category: "Governance", q: "What is the difference between governance and management?" },
  { category: "Governance", q: "What is a conflict of interest and how should it be handled?" },
  { category: "Governance", q: "What is the role of the board chair?" },
  { category: "Governance", q: "What is quorum and how is it typically set?" },
  { category: "Finance", q: "What financial oversight responsibilities do board members have?" },
  { category: "Finance", q: "What is an executive limitations policy?" },
  { category: "Motions", q: "What is the correct procedure for making a motion?" },
  { category: "Motions", q: "Can a motion be amended after it has been seconded?" },
];

export default function BoardAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const ask = async (question) => {
    const q = question || input.trim();
    if (!q) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: q }]);
    setLoading(true);

    const systemContext = `You are a knowledgeable board governance assistant specializing in nonprofit governance, Alberta nonprofit law, Robert's Rules of Order, and Canadian nonprofit management. 
    Provide accurate, practical guidance. When discussing Alberta-specific law, reference the Alberta Societies Act, Companies Act (as applicable), or the Nonprofit Organizations Act. 
    Be clear, concise, and professional. Format responses with markdown for clarity.
    Always note when questions require specific legal advice from a qualified lawyer.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `${systemContext}\n\nBoard member question: ${q}`,
    });

    setMessages(prev => [...prev, { role: "assistant", content: response }]);
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    ask();
  };

  const categories = [...new Set(PRESET_QUESTIONS.map(q => q.category))];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-semibold flex items-center gap-2">
          Board Assistant <Sparkles size={22} className="text-accent" />
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Ask questions about governance, Alberta nonprofit law, Robert's Rules, and more</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Preset questions */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <BookOpen size={15} className="text-muted-foreground" />
              <span className="text-sm font-medium">Common Questions</span>
            </div>
            <div className="divide-y divide-border">
              {categories.map(cat => (
                <div key={cat}>
                  <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30">{cat}</p>
                  {PRESET_QUESTIONS.filter(q => q.category === cat).map((q, i) => (
                    <button key={i} onClick={() => ask(q.q)}
                      className="w-full text-left px-4 py-2.5 text-xs text-foreground hover:bg-muted transition flex items-start gap-2 group">
                      <ChevronRight size={12} className="mt-0.5 shrink-0 text-muted-foreground group-hover:text-primary" />
                      {q.q}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="bg-card border border-border rounded-xl flex flex-col" style={{ minHeight: "500px" }}>
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: "500px" }}>
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 text-muted-foreground">
                  <MessageSquare size={40} className="mb-3 opacity-30" />
                  <p className="font-medium">Ask me anything about governance</p>
                  <p className="text-sm mt-1">Use the preset questions or type your own</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[90%] rounded-xl px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}>
                    {msg.role === "assistant" ? (
                      <ReactMarkdown className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground">
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    Thinking...
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-border p-3">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)} disabled={loading}
                  className="flex-1 border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Ask a governance question..." />
                <button type="submit" disabled={loading || !input.trim()} className="bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:opacity-90 transition disabled:opacity-40">
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2 px-1">This assistant provides general information only. Consult a qualified lawyer for specific legal advice.</p>
        </div>
      </div>
    </div>
  );
}
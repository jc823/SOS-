import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Bot, Send, Loader2, ChevronDown, ChevronUp, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIAssistantProps {
  shopId: number;
  assessmentId: number;
  shopName: string;
}

const SUGGESTED = [
  "What should I focus on first?",
  "What's my biggest revenue opportunity right now?",
  "How do I improve my follow-up process?",
  "How am I doing compared to other shops?",
];

const STORAGE_KEY = (shopId: number) => `sos_chat_${shopId}`;

export default function AIAssistant({ shopId, assessmentId, shopName }: AIAssistantProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY(shopId));
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const bottomRef = useRef<HTMLDivElement>(null);

  // Persist messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY(shopId), JSON.stringify(messages.slice(-30)));
    } catch {}
  }, [messages, shopId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const chatMutation = trpc.aiAssistant.chat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I ran into an issue. Please try again in a moment." },
      ]);
    },
  });

  function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || chatMutation.isPending) return;
    setInput("");
    const newHistory = [...messages, { role: "user" as const, content: msg }];
    setMessages(newHistory);
    chatMutation.mutate({
      message: msg,
      assessmentId,
      conversationHistory: newHistory.slice(-10), // last 10 messages for context
    });
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="bg-white/[0.03] border border-gold/20 rounded-2xl overflow-hidden">
      {/* Header — always visible, click to expand */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
            <Sparkles size={15} className="text-gold" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold">AI Business Coach</p>
            <p className="text-[11px] text-muted-foreground">Ask anything about your scores or next steps</p>
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-white/8">
          {/* Message list */}
          <div className="h-72 overflow-y-auto px-4 py-3 space-y-3 scroll-smooth">
            {messages.length === 0 && (
              <div className="text-center py-6">
                <Bot size={28} className="text-gold/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground mb-4">
                  I know your full SOS results for {shopName}.<br />Ask me anything.
                </p>
                {/* Suggested questions */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGGESTED.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="text-[11px] bg-white/5 hover:bg-gold/10 hover:text-gold border border-white/10 hover:border-gold/30 rounded-lg px-3 py-1.5 text-muted-foreground transition-all text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles size={11} className="text-gold" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-gold text-black font-medium rounded-br-sm"
                      : "bg-white/[0.06] text-white/90 rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {chatMutation.isPending && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                  <Sparkles size={11} className="text-gold" />
                </div>
                <div className="bg-white/[0.06] rounded-2xl rounded-bl-sm px-3.5 py-3 flex gap-1 items-center">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-gold/60 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggested questions (after messages exist) */}
          {messages.length > 0 && messages.length < 3 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTED.slice(0, 2).map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  disabled={chatMutation.isPending}
                  className="text-[10px] bg-white/5 hover:bg-gold/10 hover:text-gold border border-white/10 hover:border-gold/30 rounded-lg px-2.5 py-1 text-muted-foreground transition-all disabled:opacity-40"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-white/8 px-4 py-3 flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask your AI coach anything…"
              rows={1}
              disabled={chatMutation.isPending}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-gold/40 disabled:opacity-50"
            />
            <Button
              onClick={() => send()}
              disabled={!input.trim() || chatMutation.isPending}
              className="bg-gold text-black hover:bg-gold/90 h-9 w-9 p-0 shrink-0 rounded-xl"
            >
              {chatMutation.isPending
                ? <Loader2 size={14} className="animate-spin" />
                : <Send size={14} />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

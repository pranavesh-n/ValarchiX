"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  GraduationCap,
  Sparkles,
  Calculator,
  RefreshCw,
  Trash2,
  HelpCircle,
  MessageSquare,
  Info,
  Scale,
  ShieldAlert,
  X,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolsUsed?: string[];
  timestamp: number;
}

const SUGGESTION_CHIPS = [
  { label: "What is a Mutual Fund?", icon: "📊" },
  { label: "Calculate SIP for ₹5000/month at 12% for 10 years", icon: "🧮" },
  { label: "Why Mutual Funds instead of FDs?", icon: "⚖️" },
  { label: "Explain compounding with an example", icon: "📈" },
  { label: "I earn ₹12 LPA, which tax regime is better?", icon: "🏛️" },
  { label: "I need ₹50 lakhs in 10 years, how much SIP?", icon: "🎯" },
  { label: "What is asset allocation?", icon: "🧩" },
  { label: "How much do I need to retire at 45?", icon: "🏖️" },
];

const TOOL_LABELS: Record<string, string> = {
  sipCalculator: "SIP Calculator",
  lumpsumCalculator: "Lumpsum Calculator",
  compoundInterestCalc: "Compound Interest",
  fdVsMfCompare: "FD vs MF Comparison",
  goalPlanner: "Goal Planner",
  retirementCalc: "Retirement Calculator",
  taxCompare: "Tax Regime Comparison",
  ppfCalc: "PPF Calculator",
  epfCalc: "EPF Calculator",
  npsCalc: "NPS Calculator",
  ssyCalc: "SSY Sukanya Calculator",
  apyCalc: "Atal Pension (APY)",
  pomisCalc: "Post Office MIS",
  rdCalc: "Recurring Deposit (RD)",
  hraExemptionCalc: "HRA Exemption",
  emiCalc: "Loan EMI Calculator",
  swpCalc: "SWP Pension Calculator",
  costOfDelayCalc: "Cost of Delay",
  latteFactorCalc: "Latte Factor",
  emergencyFundCalc: "Emergency Fund",
  rentVsBuyCalc: "Rent vs Buy Property",
  netWorthCalc: "Net Worth Tracker",
  hlvCalc: "Term Cover / HLV",
  gratuityCalc: "Gratuity Calculator",
  creditCardPayoffCalc: "Credit Card Payoff",
};

export default function VaathiPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load chat history from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("vaathi-chat-history");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch {
        // Ignore corrupted data
      }
    }
  }, []);

  // Save to localStorage when messages change
  useEffect(() => {
    if (mounted && messages.length > 0) {
      localStorage.setItem("vaathi-chat-history", JSON.stringify(messages));
    }
  }, [messages, mounted]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem("vaathi-chat-history");
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setIsStreaming(true);

    // Create placeholder for assistant response
    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };
    setMessages([...updatedMessages, assistantMessage]);

    try {
      const response = await fetch("/api/vaathi/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        let errorMsg = `Server error (${response.status})`;
        try {
          const rawText = await response.text();
          const errorData = JSON.parse(rawText);
          errorMsg = errorData.error || errorMsg;
        } catch {
          // If response body is non-JSON text
        }
        throw new Error(errorMsg);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let toolsUsed: string[] = [];

      if (reader) {
        let streamBuffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          streamBuffer += decoder.decode(value, { stream: true });
          const events = streamBuffer.split("\n\n");
          streamBuffer = events.pop() || ""; // Keep incomplete event block in buffer

          for (const event of events) {
            for (const line of event.split("\n")) {
              if (line.startsWith("data: ")) {
                const jsonStr = line.slice(6).trim();
                if (!jsonStr) continue;

                let data: any;
                try {
                  data = JSON.parse(jsonStr);
                } catch {
                  continue;
                }

                if (data.type === "content") {
                  fullContent += data.content;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: fullContent }
                        : m
                    )
                  );
                } else if (data.type === "tools_used") {
                  toolsUsed = data.tools;
                } else if (data.type === "error") {
                  throw new Error(data.error);
                }
              }
            }
          }
        }
      }

      // Final update with tools used
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: fullContent, toolsUsed }
            : m
        )
      );
    } catch (error: any) {
      console.error("Chat error:", error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: `⚠️ ${error.message || "Sorry, I encountered an error. Please try again."}`,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-11rem)] md:h-[calc(100vh-8rem)] max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-border-navy pb-3 pt-1 px-2 shrink-0">
        <div className="flex items-center gap-3">
          <img
            src="/vaathi-avatar.jpg"
            alt="Valarchi Vaathi"
            className="h-10 w-10 rounded-xl object-cover border border-emerald/40 shadow-lg shadow-emerald/20"
          />
          <div>
            <h1 className="text-lg md:text-xl font-extrabold text-heading tracking-tight">
              Valarchi Vaathi
            </h1>
            <p className="text-[11px] text-muted-grey">
              Your personal finance teacher
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-grey hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 py-3 px-2 scroll-smooth">
        {messages.length === 0 ? (
          /* Welcome Hero Screen */
          <div className="flex flex-col items-center justify-start py-4 md:py-6 text-center space-y-4 md:space-y-5 animate-fadeIn max-w-4xl mx-auto">
            <img
              src="/vaathi-avatar.jpg"
              alt="Valarchi Vaathi"
              className="h-16 w-16 md:h-20 md:w-20 rounded-2xl object-cover border-2 border-emerald/40 shadow-xl shadow-emerald/20 ring-4 ring-emerald/10 shrink-0"
            />
            <div className="space-y-1.5 max-w-lg">
              <h2 className="text-2xl md:text-3xl font-extrabold text-heading tracking-tight">
                Vanakkam! 🙏
              </h2>
              <p className="text-xs md:text-sm text-muted-grey leading-relaxed">
                I am <strong className="text-emerald font-bold">Valarchi Vaathi</strong> — your dedicated personal finance tutor. Ask me anything about mutual funds, SIPs, taxes, retirement, or compounding.
              </p>
            </div>

            {/* Quick Suggestion Chips Grid */}
            <div className="w-full max-w-3xl space-y-2 pt-1">
              <p className="text-[11px] font-semibold text-muted-grey uppercase tracking-wider flex items-center justify-center gap-1.5">
                <HelpCircle size={13} className="text-emerald" />
                Popular Questions
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-1">
                {SUGGESTION_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => sendMessage(chip.label)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border-navy bg-navy-card/60 hover:bg-navy-light hover:border-emerald/40 text-left text-xs text-light-grey font-medium transition-all shadow-sm hover:shadow-md group cursor-pointer"
                  >
                    <span className="text-base shrink-0 p-1 rounded-lg bg-navy-bg border border-border-navy">{chip.icon}</span>
                    <span className="group-hover:text-emerald transition-colors leading-tight">{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Chat Messages Stream */
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 animate-fadeIn ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <img
                  src="/vaathi-avatar.jpg"
                  alt="Vaathi"
                  className="h-9 w-9 rounded-xl object-cover shrink-0 mt-1 shadow-md border border-emerald/30"
                />
              )}

              <div
                className={`max-w-[92%] sm:max-w-[85%] md:max-w-[78%] rounded-2xl px-5 py-4 text-xs md:text-sm leading-relaxed shadow-sm ${
                  msg.role === "user"
                    ? "bg-emerald/15 border border-emerald/30 text-heading font-medium rounded-tr-none"
                    : "bg-navy-card border border-border-navy text-light-grey rounded-tl-none"
                }`}
              >
                {msg.role === "assistant" && msg.content === "" && isStreaming ? (
                  <div className="flex items-center gap-2.5 text-emerald py-1">
                    <Sparkles size={16} className="animate-pulse" />
                    <span className="text-xs font-semibold">Vaathi is calculating response...</span>
                  </div>
                ) : (
                  <div className="prose dark:prose-invert max-w-none space-y-3 text-light-grey leading-normal">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Table styling
                        table: ({ node, ...props }) => (
                          <div className="overflow-x-auto my-3 border border-border-navy rounded-xl shadow-sm bg-navy-bg/50">
                            <table className="min-w-full divide-y divide-border-navy text-xs md:text-sm" {...props} />
                          </div>
                        ),
                        thead: ({ node, ...props }) => (
                          <thead className="bg-navy-light/80 text-emerald font-bold uppercase tracking-wider text-[11px]" {...props} />
                        ),
                        th: ({ node, ...props }) => (
                          <th className="px-3.5 py-2.5 text-left border-b border-border-navy font-semibold text-emerald" {...props} />
                        ),
                        td: ({ node, ...props }) => (
                          <td className="px-3.5 py-2.5 border-b border-border-navy/40 text-light-grey" {...props} />
                        ),
                        // Typography styling
                        h1: ({ node, ...props }) => (
                          <h1 className="text-lg md:text-xl font-extrabold text-heading mt-4 mb-2 border-b border-border-navy/50 pb-1" {...props} />
                        ),
                        h2: ({ node, ...props }) => (
                          <h2 className="text-base md:text-lg font-bold text-heading mt-3.5 mb-1.5" {...props} />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3 className="text-sm md:text-base font-semibold text-emerald mt-3 mb-1" {...props} />
                        ),
                        p: ({ node, ...props }) => (
                          <p className="my-1.5 leading-relaxed" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul className="list-disc list-inside space-y-1 my-2 pl-1" {...props} />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol className="list-decimal list-inside space-y-1 my-2 pl-1" {...props} />
                        ),
                        blockquote: ({ node, ...props }) => (
                          <blockquote className="border-l-4 border-emerald bg-emerald/5 px-4 py-2 my-3 rounded-r-xl italic text-xs text-muted-grey" {...props} />
                        ),
                        strong: ({ node, ...props }) => (
                          <strong className="font-bold text-emerald" {...props} />
                        ),
                        code: ({ node, ...props }) => (
                          <code className="bg-navy-light px-1.5 py-0.5 rounded text-emerald font-mono text-xs border border-border-navy/60" {...props} />
                        )
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}

                {/* Tool Usage Badges */}
                {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-border-navy/50">
                    <Calculator size={13} className="text-emerald shrink-0" />
                    <span className="text-[10px] text-muted-grey font-medium">Calculators used:</span>
                    {msg.toolsUsed.map((tool) => (
                      <span
                        key={tool}
                        className="text-[10px] font-bold text-emerald bg-emerald/10 border border-emerald/20 px-2 py-0.5 rounded-full"
                      >
                        {TOOL_LABELS[tool] || tool}
                      </span>
                    ))}
                  </div>
                )}

                {/* Inline Retry Button for network/fetch errors */}
                {msg.content.startsWith("⚠️") && !isLoading && (
                  <button
                    onClick={() => {
                      const msgIdx = messages.findIndex((m) => m.id === msg.id);
                      const lastUserMsg = messages
                        .slice(0, msgIdx)
                        .reverse()
                        .find((m) => m.role === "user");
                      if (lastUserMsg) {
                        setMessages((prev) => prev.slice(0, msgIdx));
                        sendMessage(lastUserMsg.content);
                      }
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald/10 hover:bg-emerald/20 border border-emerald/30 text-emerald rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    <RefreshCw size={12} />
                    Retry Question
                  </button>
                )}
              </div>

              {msg.role === "user" && (
                <div className="h-9 w-9 rounded-xl bg-navy-light border border-border-navy flex items-center justify-center shrink-0 mt-1 shadow-sm">
                  <span className="text-xs font-bold text-emerald">You</span>
                </div>
              )}
            </div>
          ))
        )}

        {/* Scroll Anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="shrink-0 border-t border-border-navy pt-3 pb-2 px-2 bg-navy-bg">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Vaathi a personal finance question..."
              rows={1}
              className="w-full resize-none bg-navy-card border border-border-navy rounded-xl px-4 py-3 pr-12 text-xs md:text-sm text-heading placeholder:text-muted-grey outline-none focus:border-emerald/60 focus:ring-1 focus:ring-emerald/20 transition-all shadow-inner"
              style={{ minHeight: "46px", maxHeight: "120px" }}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="h-11 w-11 rounded-xl bg-emerald hover:bg-emerald/90 disabled:bg-navy-light disabled:text-muted-grey flex items-center justify-center text-navy-bg transition-all shrink-0 shadow-lg shadow-emerald/20 disabled:shadow-none cursor-pointer"
          >
            {isLoading ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
        <p className="text-[10px] text-muted-grey text-center mt-2">
          Valarchi Vaathi is an educational tutor. Not personalized financial advice.
        </p>
      </div>
    </div>
  );
}

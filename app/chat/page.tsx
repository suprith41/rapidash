"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send } from "lucide-react";
import { useSession } from "@/contexts/SessionContext";
import DashboardLayout from "@/components/DashboardLayout";
import { askDash } from "@/lib/api";
import { Reveal, TiltCard } from "@/components/AppMotion";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  isThinking?: boolean;
};

// Simple custom Markdown renderer for bold, list items, and paragraphs
function renderInline(text: string) {
  const regex = /(\*\*.*?\*\*)/g;
  const splitParts = text.split(regex);
  return splitParts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-extrabold text-slate-800">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-2">
      {lines.map((line, lineIndex) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const content = trimmed.substring(2);
          return (
            <ul key={lineIndex} className="list-disc pl-5 space-y-1 my-1">
              <li className="text-slate-700">{renderInline(content)}</li>
            </ul>
          );
        }

        if (trimmed === "") {
          return <div key={lineIndex} className="h-1" />;
        }

        return (
          <p key={lineIndex} className="leading-relaxed text-slate-700">
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
}

export default function ChatPage() {
  const { session } = useSession();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  // 1. Declare sendDashMessage first to avoid scoping issues
  const sendDashMessage = useCallback(async (prompt?: string) => {
    if (!session) return;
    const content = (prompt ?? draft).trim();
    if (!content || isSending) return;

    // Add user message to log and a placeholder thinking message for the assistant
    const updatedMessages: ChatMessage[] = [
      ...chatMessages,
      { role: "user", content },
    ];
    setChatMessages([
      ...updatedMessages,
      { role: "assistant", content: "", isThinking: true },
    ]);
    setDraft("");
    setIsSending(true);

    try {
      const replyText = await askDash(session, [
        ...chatMessages.map(({ role, content: messageContent }) => ({ role, content: messageContent })),
        { role: "user", content },
      ]);

      setChatMessages((prev) => {
        const next = [...prev];
        const lastIdx = next.length - 1;
        if (lastIdx >= 0 && next[lastIdx].role === "assistant") {
          next[lastIdx] = { ...next[lastIdx], content: replyText, isThinking: false };
        }
        return next;
      });
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages((prev) => {
        const next = [...prev];
        const lastIdx = next.length - 1;
        if (lastIdx >= 0 && next[lastIdx].role === "assistant") {
          next[lastIdx] = {
            ...next[lastIdx],
            content: "I encountered an error connecting to Dash. Please check that the backend is running and GROQ_API_KEY is configured there.",
            isThinking: false,
          };
        }
        return next;
      });
    } finally {
      setIsSending(false);
    }
  }, [chatMessages, session, isSending, draft]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isSending]);

  useEffect(() => {
    if (typeof window !== "undefined" && session && !isInitialized.current) {
      isInitialized.current = true;
      const params = new URLSearchParams(window.location.search);
      const query = params.get("q");
      if (query) {
        void sendDashMessage(query);
      }
    }
  }, [session, sendDashMessage]);

  if (!session) return null;

  const welcomeSuggestions = [
    `Why is my health score ${session?.health_score?.score ?? "N/A"}/100?`,
    `What should I do with my ${session?.holdings[0]?.ticker_symbol || "main"} holding?`,
    `How much should I invest in SIP monthly?`,
    `Which holding has the highest risk?`,
  ];

  return (
    <DashboardLayout title="Chat with Dash">
      <Reveal className="max-w-4xl mx-auto [perspective:1200px]" delay={0.05}>
      <TiltCard className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-2xl border border-slate-100 shadow-[0_14px_50px_rgba(99,91,255,0.1)] overflow-hidden">
        {/* CHAT HEADER */}
        <div className="border-b border-slate-100 px-6 py-4 bg-slate-50/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Dash</h2>
              <p className="text-[10px] text-slate-400 font-medium">Your AI portfolio advisor</p>
            </div>
          </div>
          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 border border-slate-200/50 px-2.5 py-1 rounded-full">
            Powered by Groq · Portfolio-aware
          </span>
        </div>

        {/* MESSAGES AREA */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/10">
          <AnimatePresence initial={false}>
            {chatMessages.length === 0 ? (
              /* WELCOME STATE */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto py-8"
              >
                <div className="flex size-14 items-center justify-center rounded-full bg-[#635bff] text-white font-extrabold text-2xl shadow-[0_4px_12px_rgba(99,91,255,0.3)]">
                  D
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-800">{"Hi, I'm Dash"}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Ask me anything about your portfolio
                </p>

                {/* Suggestion Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-8 w-full">
                  {welcomeSuggestions.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => void sendDashMessage(prompt)}
                      className="px-4 py-3 rounded-xl border border-slate-100 bg-white hover:border-[#635bff]/40 hover:bg-[#635bff]/5 text-xs font-semibold text-slate-600 hover:text-[#635bff] text-left transition duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.01)]"
                      type="button"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              /* MESSAGE LOG */
              <div className="space-y-4">
                {chatMessages.map((msg, idx) => {
                  const isDash = msg.role === "assistant";
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className={`flex gap-3 max-w-[70%] ${
                        isDash ? "self-start text-left" : "ml-auto justify-end text-right"
                      }`}
                    >
                      {isDash && (
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#635bff] text-white font-extrabold text-xs shadow-sm">
                          D
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm border ${
                          isDash
                            ? "bg-white text-slate-700 border-slate-100 rounded-tl-none"
                            : "bg-[#635bff] text-white border-[#635bff] rounded-tr-none"
                        }`}
                      >
                        {isDash ? (
                          msg.isThinking ? (
                            <div className="flex items-center gap-2 py-1 text-slate-400 font-semibold select-none animate-pulse">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#635bff] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#635bff]"></span>
                              </span>
                              <span>Thinking...</span>
                            </div>
                          ) : (
                            <Markdown text={msg.content} />
                          )
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isSending && chatMessages.length > 0 && chatMessages[chatMessages.length - 1].role !== "assistant" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 max-w-[70%] self-start text-left items-start"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#635bff] text-white font-extrabold text-xs shadow-sm">
                D
              </div>
              <div className="rounded-2xl px-4 py-3 bg-white text-slate-400 border border-slate-100 rounded-tl-none shadow-sm flex items-center gap-1">
                <span
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT BAR */}
        <div className="border-t border-slate-100 p-4 bg-white shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendDashMessage();
                }
              }}
              disabled={isSending}
              placeholder="Ask Dash anything..."
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-xs outline-none transition placeholder:text-slate-300 focus:border-[#635bff] disabled:bg-slate-50"
            />
            <button
              onClick={() => void sendDashMessage()}
              disabled={isSending || !draft.trim()}
              className="p-3 rounded-xl bg-[#635bff] text-white hover:bg-[#635bff]/90 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0 shadow-md"
              type="button"
            >
              <Send className="size-4" />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-2 font-medium">
            Dash has access to your portfolio data
          </p>
        </div>
      </TiltCard>
      </Reveal>
    </DashboardLayout>
  );
}

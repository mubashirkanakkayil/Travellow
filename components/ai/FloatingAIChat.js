"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  Sparkles,
  Send,
  Loader2,
  AlertCircle,
  RotateCcw,
  Star,
  Hotel as HotelIcon,
  UserCheck,
  ArrowRight,
  X,
  MessageCircle,
  LogIn,
  UserPlus,
  Compass,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import HotelBookingModal from "@/components/bookings/HotelBookingModal";
import GuideBookingModal from "@/components/bookings/GuideBookingModal";

/**
 * Custom typography component that formats Markdown bold (**text**) and bullet points (* item)
 */
function FormatChatMessage({ content }) {
  if (!content) return null;

  const lines = content.split("\n");

  return (
    <div className="space-y-2 text-xs leading-relaxed text-slate-100">
      {lines.map((line, lIdx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={lIdx} className="h-1" />;

        const isBullet = trimmed.startsWith("* ") || trimmed.startsWith("- ");
        const lineText = isBullet ? trimmed.substring(2) : trimmed;

        const parts = lineText.split(/(\*\*.*?\*\*)/g);

        const renderedParts = parts.map((part, pIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={pIdx} className="font-bold text-coral-300">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        });

        if (isBullet) {
          return (
            <div key={lIdx} className="flex items-start gap-2 pl-1 my-1">
              <span className="w-1.5 h-1.5 rounded-full bg-coral-400 shrink-0 mt-1.5 shadow-sm" />
              <span className="flex-1 text-slate-200">{renderedParts}</span>
            </div>
          );
        }

        return <p key={lIdx} className="text-slate-100">{renderedParts}</p>;
      })}
    </div>
  );
}

export default function FloatingAIChat() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "ASSISTANT",
      content:
        "Hello! I'm **Travellow AI**, your smart travel assistant. Ask me anything about destinations, luxury stays, or local guides!",
      recommendedHotels: [],
      recommendedGuides: [],
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authStatus, setAuthStatus] = useState("loading"); // "loading" | "authenticated" | "unauthenticated"

  // Booking Modal States
  const [selectedHotelForBooking, setSelectedHotelForBooking] = useState(null);
  const [selectedGuideForBooking, setSelectedGuideForBooking] = useState(null);

  // Internal scroll ref (Does NOT scroll main webpage window)
  const messagesContainerRef = useRef(null);

  // Suppress Floating Chatbot on specific routes: /admin/*, /sign-in, /sign-up, /guide/apply
  const isExcludedPage =
    !pathname ||
    pathname.startsWith("/admin") ||
    pathname === "/sign-in" ||
    pathname === "/sign-up" ||
    pathname === "/guide/apply";

  // Check auth status
  const checkAuth = async () => {
    try {
      setAuthStatus("loading");
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setAuthStatus("authenticated");
          return;
        }
      }
      setAuthStatus("unauthenticated");
    } catch (err) {
      setAuthStatus("unauthenticated");
    }
  };

  useEffect(() => {
    if (isExcludedPage) return;
    checkAuth();

    const handleAuthChange = () => {
      checkAuth();
    };
    window.addEventListener("auth-change", handleAuthChange);
    return () => window.removeEventListener("auth-change", handleAuthChange);
  }, [pathname, isExcludedPage]);

  // Scroll ONLY the internal chat container when messages change
  useEffect(() => {
    if (isOpen && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages, loading, isOpen]);

  if (isExcludedPage) {
    return null;
  }

  const handleSendMessage = async () => {
    const textToSend = inputMessage.trim();
    if (!textToSend || loading) return;

    if (textToSend.length > 500) {
      setError("Message length cannot exceed 500 characters.");
      return;
    }

    setError("");

    // Verify Auth status
    if (authStatus !== "authenticated") {
      await checkAuth();
      if (authStatus !== "authenticated") {
        return;
      }
    }

    try {
      setLoading(true);

      // Add user message to UI immediately
      const userMsgObj = { role: "USER", content: textToSend };
      setMessages((prev) => [...prev, userMsgObj]);
      setInputMessage("");

      // Dispatch API request to POST /api/ai/chat
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          sessionId: sessionId || null,
        }),
      });

      if (res.status === 401) {
        setAuthStatus("unauthenticated");
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.sessionId) {
          setSessionId(data.sessionId);
        }

        const assistantMsgObj = {
          role: "ASSISTANT",
          content: data.message?.content || "I am happy to help with your travel request!",
          recommendedHotels: data.recommendedHotels || [],
          recommendedGuides: data.recommendedGuides || [],
        };

        setMessages((prev) => [...prev, assistantMsgObj]);
      } else {
        if (res.status === 401) {
          setAuthStatus("unauthenticated");
        } else {
          setError(data.message || "Failed to get AI assistant response.");
        }
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setSessionId(null);
    setError("");
    setMessages([
      {
        role: "ASSISTANT",
        content:
          "Conversation reset! I'm **Travellow AI**, ready to assist with new travel queries.",
        recommendedHotels: [],
        recommendedGuides: [],
      },
    ]);
  };

  return (
    <>
      {/* Booking Modals */}
      <HotelBookingModal
        hotel={selectedHotelForBooking}
        isOpen={!!selectedHotelForBooking}
        onClose={() => setSelectedHotelForBooking(null)}
      />

      <GuideBookingModal
        guide={selectedGuideForBooking}
        isOpen={!!selectedGuideForBooking}
        onClose={() => setSelectedGuideForBooking(null)}
      />

      {/* CHAT POPUP WINDOW */}
      {isOpen && (
        <div
          className="fixed bottom-20 right-3 left-3 sm:left-auto sm:right-6 z-50 w-auto sm:w-[380px] h-[70vh] max-h-[580px] min-h-[420px] bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col justify-between overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
          role="dialog"
          aria-label="Travellow AI Assistant Window"
        >
          {/* Header */}
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-coral-500 to-coral-600 flex items-center justify-center text-white shadow-md shadow-coral-500/30 shrink-0">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                  Travellow AI
                  <Sparkles size={12} className="text-coral-400 animate-pulse" />
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">AI Travel Assistant</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {sessionId && (
                <button
                  onClick={handleResetChat}
                  title="Start New Chat"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-coral-400 hover:bg-slate-800 transition-colors"
                >
                  <RotateCcw size={16} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close Travellow AI Assistant"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Error Callout */}
          {error && (
            <div className="mx-3 mt-2 p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2 shrink-0">
              <AlertCircle size={15} className="shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Internal Scrollable Message History Area */}
          <div
            ref={messagesContainerRef}
            className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 scrollbar-thin"
          >
            {authStatus === "unauthenticated" ? (
              <div className="p-5 bg-slate-800/80 border border-slate-700/70 rounded-2xl text-center space-y-4 my-auto">
                <div className="w-12 h-12 rounded-full bg-coral-500/20 text-coral-400 mx-auto flex items-center justify-center">
                  <Bot size={26} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-white">Sign in to use Travellow AI Assistant</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Ask questions about destinations, stays, and tour guides powered by Google Gemini.
                  </p>
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <Link href="/sign-in" onClick={() => setIsOpen(false)}>
                    <Button variant="primary" size="sm" className="w-full justify-center text-xs py-2">
                      <LogIn size={14} />
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/sign-up" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full justify-center text-xs py-2 border-slate-700 text-slate-200 hover:bg-slate-800">
                      <UserPlus size={14} />
                      Registration
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    msg.role === "USER" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[88%] p-3.5 sm:p-4 rounded-2xl text-xs leading-relaxed ${
                      msg.role === "USER"
                        ? "bg-gradient-to-r from-coral-500 to-coral-600 text-white rounded-tr-none shadow-md font-medium"
                        : "bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-tl-none shadow-sm"
                    }`}
                  >
                    {msg.role === "USER" ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <FormatChatMessage content={msg.content} />
                    )}
                  </div>

                  {/* Recommended Stays Cards */}
                  {msg.recommendedHotels && msg.recommendedHotels.length > 0 && (
                    <div className="mt-2.5 w-full max-w-[92%] space-y-2">
                      <span className="text-[10px] font-bold text-coral-400 uppercase tracking-widest flex items-center gap-1">
                        <HotelIcon size={12} /> Recommended Stays:
                      </span>
                      <div className="space-y-2">
                        {msg.recommendedHotels.map((h) => (
                          <div
                            key={h._id}
                            className="bg-slate-800/90 border border-slate-700 rounded-xl p-3 space-y-2 text-white text-xs shadow-sm"
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span className="truncate text-slate-100">{h.name}</span>
                              <span className="text-amber-400 flex items-center gap-0.5 shrink-0 text-[11px]">
                                <Star size={11} className="fill-amber-400 text-amber-400" />
                                {h.rating || 4.8}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300 italic line-clamp-2 leading-relaxed bg-black/20 p-1.5 rounded-lg">
                              &ldquo;{h.aiReason}&rdquo;
                            </p>
                            <div className="flex items-center justify-between pt-1 border-t border-slate-700/60">
                              <span className="font-bold text-coral-400 text-xs">
                                ₹{h.pricePerNight?.toLocaleString("en-IN")}/night
                              </span>
                              <button
                                onClick={() => setSelectedHotelForBooking(h)}
                                className="text-[10px] bg-coral-500 hover:bg-coral-600 px-2.5 py-1 rounded-lg text-white font-bold flex items-center gap-1 transition-all"
                              >
                                Book Hotel
                                <ArrowRight size={10} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended Guides Cards */}
                  {msg.recommendedGuides && msg.recommendedGuides.length > 0 && (
                    <div className="mt-2.5 w-full max-w-[92%] space-y-2">
                      <span className="text-[10px] font-bold text-coral-400 uppercase tracking-widest flex items-center gap-1">
                        <UserCheck size={12} /> Recommended Local Guides:
                      </span>
                      <div className="space-y-2">
                        {msg.recommendedGuides.map((g) => (
                          <div
                            key={g._id}
                            className="bg-slate-800/90 border border-slate-700 rounded-xl p-3 space-y-2 text-white text-xs shadow-sm"
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span className="truncate text-slate-100">{g.name}</span>
                              <span className="text-amber-400 flex items-center gap-0.5 shrink-0 text-[11px]">
                                <Star size={11} className="fill-amber-400 text-amber-400" />
                                {g.rating || 4.9}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300 italic line-clamp-2 leading-relaxed bg-black/20 p-1.5 rounded-lg">
                              &ldquo;{g.aiReason}&rdquo;
                            </p>
                            <div className="flex items-center justify-between pt-1 border-t border-slate-700/60">
                              <span className="font-bold text-coral-400 text-xs">
                                ₹{g.hourlyRate}/hr
                              </span>
                              <button
                                onClick={() => setSelectedGuideForBooking(g)}
                                className="text-[10px] bg-coral-500 hover:bg-coral-600 px-2.5 py-1 rounded-lg text-white font-bold flex items-center gap-1 transition-all"
                              >
                                Book Guide
                                <ArrowRight size={10} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-start gap-2">
                <div className="bg-slate-800/90 border border-slate-700 text-slate-200 p-3 rounded-2xl rounded-tl-none text-xs flex items-center gap-2 shadow-sm">
                  <Loader2 size={14} className="animate-spin text-coral-400" />
                  <span className="font-medium">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Message Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              placeholder={
                authStatus === "unauthenticated"
                  ? "Sign in to chat..."
                  : "Ask about destinations..."
              }
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value.slice(0, 500))}
              disabled={loading || authStatus === "unauthenticated"}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs placeholder:text-slate-500 focus:outline-none focus:border-coral-500 disabled:opacity-60"
            />

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={loading || !inputMessage.trim() || authStatus === "unauthenticated"}
              className="shrink-0 p-2.5 h-9 w-9 justify-center rounded-xl bg-coral-500 hover:bg-coral-600 border-none shadow-md shadow-coral-500/30"
              aria-label="Send message"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </Button>
          </form>
        </div>
      )}

      {/* FLOATING CIRCULAR TRIGGER BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close Travellow AI Assistant" : "Open Travellow AI Assistant"}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-coral-500 to-coral-600 text-white shadow-2xl shadow-coral-500/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center border border-white/20 focus:outline-none focus:ring-2 focus:ring-coral-400"
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <div className="relative flex items-center justify-center">
            <Bot size={26} />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
          </div>
        )}
      </button>
    </>
  );
}

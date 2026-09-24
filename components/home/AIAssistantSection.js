"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
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
  MapPin,
  Compass,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import HotelBookingModal from "@/components/bookings/HotelBookingModal";
import GuideBookingModal from "@/components/bookings/GuideBookingModal";
import AuthPromptModal from "@/components/bookings/AuthPromptModal";

const SUGGESTED_PROMPTS = [
  "What should I do in Goa?",
  "Which hotels do you have in Kerala?",
  "Tell me about local guides in Bali.",
  "What is a good destination for beaches?",
];

/**
 * Custom typography component that formats Markdown bold (**text**) and bullet points (* item)
 * with elegant styling, crisp contrast, and proper spacing.
 */
function FormatChatMessage({ content }) {
  if (!content) return null;

  const lines = content.split("\n");

  return (
    <div className="space-y-2.5 text-xs sm:text-sm leading-relaxed text-slate-100">
      {lines.map((line, lIdx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={lIdx} className="h-1" />;

        // Check if list item
        const isBullet = trimmed.startsWith("* ") || trimmed.startsWith("- ");
        const lineText = isBullet ? trimmed.substring(2) : trimmed;

        // Parse **bold** parts
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
            <div key={lIdx} className="flex items-start gap-2.5 pl-1 my-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-coral-400 shrink-0 mt-2 shadow-sm" />
              <span className="flex-1 text-slate-200">{renderedParts}</span>
            </div>
          );
        }

        return <p key={lIdx} className="text-slate-100">{renderedParts}</p>;
      })}
    </div>
  );
}

export default function AIAssistantSection() {
  const [messages, setMessages] = useState([
    {
      role: "ASSISTANT",
      content:
        "Hello! I'm **Travellow AI**, your 24/7 smart travel assistant. Ask me anything about destinations, accommodations, or local guides grounded in Travellow's database!",
      recommendedHotels: [],
      recommendedGuides: [],
    },
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authStatus, setAuthStatus] = useState("loading"); // "loading" | "authenticated" | "unauthenticated"
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Booking Modal States
  const [selectedHotelForBooking, setSelectedHotelForBooking] = useState(null);
  const [selectedGuideForBooking, setSelectedGuideForBooking] = useState(null);

  // Container-level scroll ref (Does NOT scroll main webpage window)
  const messagesContainerRef = useRef(null);

  // Scroll ONLY the internal chat container to bottom when messages update
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Initial Auth Check on Mount
  useEffect(() => {
    async function checkAuth() {
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
    }
    checkAuth();
  }, []);

  const handleSendMessage = async (customText = null) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend) return;
    if (textToSend.length > 500) {
      setError("Message length cannot exceed 500 characters.");
      return;
    }

    setError("");

    // 1. Verify Auth status
    if (authStatus === "unauthenticated") {
      setShowAuthModal(true);
      return;
    }

    try {
      setLoading(true);

      // Add user message to UI immediately for instant feedback
      const userMsgObj = { role: "USER", content: textToSend };
      setMessages((prev) => [...prev, userMsgObj]);
      if (!customText) setInputMessage("");

      // 2. Dispatch API request to POST /api/ai/chat
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
        setShowAuthModal(true);
        // Remove optimistic user message on auth failure
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
          setShowAuthModal(true);
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
          "Conversation reset! I'm **Travellow AI**, ready to assist you with new travel queries.",
        recommendedHotels: [],
        recommendedGuides: [],
      },
    ]);
  };

  return (
    <section className="py-20 bg-primaryText text-white relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-coral-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-coral-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Modals */}
      <AuthPromptModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

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

      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Text & Features */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-medium text-white">
              <Sparkles size={14} className="text-coral-500 animate-pulse" />
              <span>Real Gemini AI Powered</span>
            </div>

            <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight leading-tight">
              Meet Your 24/7 AI Travel Assistant
            </h2>

            <p className="text-white/80 text-sm sm:text-base leading-relaxed">
              Have questions about destination highlights, optimal stays, or local guides? Travellow AI provides real-time, context-aware answers grounded in our MongoDB database.
            </p>

            {/* Quick Prompt Pills */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-white/70 uppercase tracking-wider block">
                Suggested Questions:
              </span>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS.map((promptText, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(promptText)}
                    disabled={loading}
                    className="text-xs bg-white/10 hover:bg-white/20 border border-white/15 px-3.5 py-2 rounded-xl text-white/90 text-left transition-all hover:border-coral-500/50 shadow-sm"
                  >
                    &ldquo;{promptText}&rdquo;
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-white/60 border-t border-white/10">
              <span className="flex items-center gap-1.5">
                <Compass size={14} className="text-coral-500" />
                MongoDB Grounded Context
              </span>
              {sessionId && (
                <button
                  onClick={handleResetChat}
                  className="flex items-center gap-1.5 text-coral-400 hover:text-coral-300 transition-colors font-medium"
                >
                  <RotateCcw size={13} />
                  Start New Chat
                </button>
              )}
            </div>
          </div>

          {/* Right Interactive Chat Box */}
          <div className="lg:col-span-7 bg-slate-900/80 border border-white/15 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-2xl flex flex-col justify-between h-[580px]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral-500 to-coral-600 flex items-center justify-center text-white shadow-md shadow-coral-500/30">
                  <Bot size={22} />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-white flex items-center gap-2">
                    Travellow AI
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </h4>
                  <p className="text-[11px] text-white/60 font-medium">Multi-Turn Travel Assistant</p>
                </div>
              </div>
              <Badge variant="coral" className="text-[10px]">
                Active Chat
              </Badge>
            </div>

            {/* Error Callout */}
            {error && (
              <div className="my-2 p-3.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2 shrink-0 shadow-sm">
                <AlertCircle size={16} className="shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Message History Timeline (Internal Scroll Container Only) */}
            <div
              ref={messagesContainerRef}
              className="flex-1 min-h-0 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin"
            >
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    msg.role === "USER" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[88%] p-4 sm:p-5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      msg.role === "USER"
                        ? "bg-gradient-to-r from-coral-500 to-coral-600 text-white rounded-tr-none shadow-md shadow-coral-500/20 font-medium"
                        : "bg-slate-800/90 border border-white/10 text-slate-100 rounded-tl-none shadow-lg backdrop-blur-md"
                    }`}
                  >
                    {msg.role === "USER" ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <FormatChatMessage content={msg.content} />
                    )}
                  </div>

                  {/* Verified Recommended Stays Cards */}
                  {msg.recommendedHotels && msg.recommendedHotels.length > 0 && (
                    <div className="mt-3.5 w-full max-w-[92%] space-y-2.5">
                      <span className="text-[11px] font-bold text-coral-400 uppercase tracking-widest flex items-center gap-1.5">
                        <HotelIcon size={14} /> Recommended Stays:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {msg.recommendedHotels.map((h) => (
                          <div
                            key={h._id}
                            className="bg-slate-800/90 border border-white/15 rounded-2xl p-3.5 space-y-2.5 text-white text-xs shadow-md hover:border-coral-500/50 transition-colors"
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span className="truncate text-slate-100">{h.name}</span>
                              <span className="text-amber-400 flex items-center gap-0.5 shrink-0 text-xs">
                                <Star size={12} className="fill-amber-400 text-amber-400" />
                                {h.rating || 4.8}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300 italic line-clamp-2 leading-relaxed bg-black/20 p-2 rounded-lg border border-white/5">
                              &ldquo;{h.aiReason}&rdquo;
                            </p>
                            <div className="flex items-center justify-between pt-1.5 border-t border-white/10">
                              <span className="font-bold text-coral-400 text-xs">
                                ₹{h.pricePerNight?.toLocaleString("en-IN")}/night
                              </span>
                              <button
                                onClick={() => setSelectedHotelForBooking(h)}
                                className="text-[10px] bg-coral-500 hover:bg-coral-600 px-3 py-1.5 rounded-xl text-white font-bold flex items-center gap-1 shadow-sm transition-all hover:scale-105"
                              >
                                Book Hotel
                                <ArrowRight size={11} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Verified Recommended Guides Cards */}
                  {msg.recommendedGuides && msg.recommendedGuides.length > 0 && (
                    <div className="mt-3.5 w-full max-w-[92%] space-y-2.5">
                      <span className="text-[11px] font-bold text-coral-400 uppercase tracking-widest flex items-center gap-1.5">
                        <UserCheck size={14} /> Recommended Local Guides:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {msg.recommendedGuides.map((g) => (
                          <div
                            key={g._id}
                            className="bg-slate-800/90 border border-white/15 rounded-2xl p-3.5 space-y-2.5 text-white text-xs shadow-md hover:border-coral-500/50 transition-colors"
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span className="truncate text-slate-100">{g.name}</span>
                              <span className="text-amber-400 flex items-center gap-0.5 shrink-0 text-xs">
                                <Star size={12} className="fill-amber-400 text-amber-400" />
                                {g.rating || 4.9}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300 italic line-clamp-2 leading-relaxed bg-black/20 p-2 rounded-lg border border-white/5">
                              &ldquo;{g.aiReason}&rdquo;
                            </p>
                            <div className="flex items-center justify-between pt-1.5 border-t border-white/10">
                              <span className="font-bold text-coral-400 text-xs">
                                ₹{g.hourlyRate}/hr
                              </span>
                              <button
                                onClick={() => setSelectedGuideForBooking(g)}
                                className="text-[10px] bg-coral-500 hover:bg-coral-600 px-3 py-1.5 rounded-xl text-white font-bold flex items-center gap-1 shadow-sm transition-all hover:scale-105"
                              >
                                Book Guide
                                <ArrowRight size={11} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              {loading && (
                <div className="flex items-start gap-2">
                  <div className="bg-slate-800/90 border border-white/15 text-slate-200 p-3.5 rounded-2xl rounded-tl-none text-xs flex items-center gap-2.5 shadow-md">
                    <Loader2 size={15} className="animate-spin text-coral-400" />
                    <span className="font-medium">Travellow AI is thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="pt-3.5 border-t border-white/10 flex items-center gap-2 shrink-0"
            >
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder={
                    authStatus === "loading"
                      ? "Checking authentication..."
                      : "Ask Travellow AI anything about destinations, stays, or guides..."
                  }
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value.slice(0, 500))}
                  disabled={loading || authStatus === "loading"}
                  className="w-full bg-slate-800/90 border border-white/15 text-white rounded-xl px-4 py-3 text-xs sm:text-sm placeholder:text-white/40 focus:outline-none focus:border-coral-500 shadow-inner"
                />
                {inputMessage.length > 400 && (
                  <span className="absolute right-3 top-3.5 text-[10px] text-white/50 font-mono">
                    {inputMessage.length}/500
                  </span>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={loading || !inputMessage.trim() || authStatus === "loading"}
                className="shrink-0 py-3 px-4 shadow-md shadow-coral-500/30"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </Button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import type {
  CourseAssessment,
  CourseCalculationResult,
  OverallCalculationResult,
} from '../types/grading';
import type { RoadmapPlan } from '../utils/roadmapPlanner';
import {
  processGradeBotQuery,
  type ChatMessage,
} from '../utils/gradeBotEngine';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Zap,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';

interface GradeBotChatProps {
  courses: CourseAssessment[];
  courseResults: Map<string, CourseCalculationResult>;
  targetSGPI: number;
  overall: OverallCalculationResult;
  onApplyPlan: (plan: RoadmapPlan) => void;
}

export const GradeBotChat: React.FC<GradeBotChatProps> = ({
  courses,
  courseResults,
  targetSGPI,
  overall,
  onApplyPlan,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');

  // Initial welcome message
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-1',
      sender: 'bot',
      text: `👋 **Hi! I'm GradeBot, your private academic advisor.**

I can calculate exact marks to hit your target, simulate "what-if" scores, or explain passing cutoffs.

Try one of the quick questions below or ask me anything!`,
      timestamp: new Date(),
      quickReplies: [
        'How do I hit my target SGPA?',
        'What if I score low in End Sem?',
        'Which unfilled subjects give the easiest boost?',
        'Can I still get 9.0+ SGPA?',
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  const handleSendQuery = (queryText: string) => {
    const textToSend = queryText.trim();
    if (!textToSend) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Process locally using live application state
    const botResponse = processGradeBotQuery(
      textToSend,
      courses,
      courseResults,
      targetSGPI,
      overall
    );

    setTimeout(() => {
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: botResponse.text,
        timestamp: new Date(),
        planAction: botResponse.planAction,
        quickReplies: botResponse.quickReplies,
      };

      setMessages((prev) => [...prev, botMessage]);
    }, 150);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendQuery(input);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `bot-welcome-${Date.now()}`,
        sender: 'bot',
        text: `🧹 **Chat cleared.** How can I help you plan your grades today?`,
        timestamp: new Date(),
        quickReplies: [
          'How do I hit my target SGPA?',
          'What if I score low in End Sem?',
          'Which unfilled subjects give the easiest boost?',
          'Can I still get 9.0+ SGPA?',
        ],
      },
    ]);
  };

  const handleApplyInChatPlan = (plan: RoadmapPlan) => {
    onApplyPlan(plan);
    setMessages((prev) => [
      ...prev,
      {
        id: `bot-applied-${Date.now()}`,
        sender: 'bot',
        text: `✅ **Plan Applied!** All minimum target marks have been populated into your table inputs. Your projected SGPA is now **${plan.achievableSGPI.toFixed(2)}**.`,
        timestamp: new Date(),
      },
    ]);
  };

  const defaultQuickChips = [
    'How do I hit my target SGPA?',
    'What if I score low in End Sem?',
    'Which unfilled subjects give the easiest boost?',
    'Can I still get 9.0+ SGPA?',
  ];

  // Simple Markdown text renderer (handles headers, bold, bullets, blockquotes)
  const renderFormattedText = (raw: string) => {
    const lines = raw.split('\n');

    return (
      <div className="space-y-1.5 text-xs sm:text-[13px] leading-relaxed">
        {lines.map((line, idx) => {
          // Headers
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-bold text-sm text-[#1d1d1f] dark:text-[#f5f5f7] pt-1">
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h3 key={idx} className="font-bold text-base text-[#1d1d1f] dark:text-[#f5f5f7] pt-1">
                {line.replace('## ', '')}
              </h3>
            );
          }

          // Blockquote / Alert
          if (line.startsWith('> ')) {
            return (
              <div
                key={idx}
                className="p-2.5 my-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 font-medium text-[11px]"
              >
                {renderInlineFormatting(line.replace('> ', ''))}
              </div>
            );
          }

          // Bullet points
          if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1">
                <span className="text-[#0071e3] dark:text-[#2997ff] select-none">•</span>
                <span className="flex-1">{renderInlineFormatting(line.replace(/^[\s*-]+/, ''))}</span>
              </div>
            );
          }

          // Empty lines
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }

          return <p key={idx}>{renderInlineFormatting(line)}</p>;
        })}
      </div>
    );
  };

  // Helper for bold and italic text
  const renderInlineFormatting = (text: string) => {
    // Regex for bold text **word**
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic text-[#86868b]">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Action Button (Bottom Right) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-xl shadow-[#0071e3]/30 transition-all hover:scale-105 active:scale-95 group"
          aria-label="Open GradeBot Assistant"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0071e3]" />
          </div>
          <span className="text-xs sm:text-sm font-semibold tracking-tight">
            Ask GradeBot 💬
          </span>
        </button>
      )}

      {/* Floating Chat Popup Window */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-[94vw] sm:w-[420px] h-[550px] max-h-[85vh] rounded-3xl bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.12] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-4 py-3.5 bg-[#f5f5f7] dark:bg-[#252528] border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#0071e3]/10 dark:bg-[#2997ff]/10 text-[#0071e3] dark:text-[#2997ff] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-bold text-[#1d1d1f] dark:text-[#f5f5f7] truncate">
                    GradeBot
                  </h3>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Live
                  </span>
                </div>
                <p className="text-[10px] text-[#86868b] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span>100% Client-Side · Zero API Keys</span>
                </p>
              </div>
            </div>

            {/* Actions: Clear Chat & Minimize */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearChat}
                className="p-1.5 rounded-full text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] hover:bg-black/[0.05] dark:hover:bg-white/[0.1] transition"
                title="Clear conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] hover:bg-black/[0.05] dark:hover:bg-white/[0.1] transition"
                title="Minimize GradeBot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-full bg-[#0071e3]/10 dark:bg-[#2997ff]/10 text-[#0071e3] dark:text-[#2997ff] flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm space-y-2 ${
                    msg.sender === 'user'
                      ? 'bg-[#0071e3] text-white rounded-br-sm'
                      : 'bg-[#f5f5f7] dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-[#f5f5f7] rounded-bl-sm border border-black/[0.04] dark:border-white/[0.06]'
                  }`}
                >
                  {renderFormattedText(msg.text)}

                  {/* Actionable Plan Button inside Bot Bubble */}
                  {msg.planAction && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleApplyInChatPlan(msg.planAction!)}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold shadow-sm transition active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5 text-yellow-300" />
                        <span>👉 Apply this Plan to Table</span>
                      </button>
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-[#0071e3] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips (above input bar) */}
          <div className="px-3 py-2 bg-[#f5f5f7]/60 dark:bg-[#252528]/60 border-t border-black/[0.04] dark:border-white/[0.06] overflow-x-auto scrollbar-none flex items-center gap-1.5 shrink-0">
            {defaultQuickChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendQuery(chip)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-medium bg-white dark:bg-[#2c2c2e] hover:bg-[#e8e8ed] dark:hover:bg-[#3a3a3c] text-[#1d1d1f] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] shadow-2xs transition shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Text Input Bar */}
          <form
            onSubmit={handleSubmit}
            className="p-3 bg-white dark:bg-[#1c1c1e] border-t border-black/[0.06] dark:border-white/[0.08] flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about scores, targets, cutoffs..."
              className="flex-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-[#f5f5f7] dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
            />

            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition active:scale-95 shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

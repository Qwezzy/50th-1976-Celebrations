import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, MapPin, Sparkles, History, Users, ArrowRight, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { getLegacyAssistantResponse, findNearbyChurches, getQuickFact, ChatMessage } from '../services/aiService';
import Markdown from 'react-markdown';

export default function LegacyAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickFact, setQuickFact] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !quickFact) {
      getQuickFact("the Class of '76").then(setQuickFact);
    }
  }, [isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', parts: [{ text: input }] };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await getLegacyAssistantResponse(messages, input);
      if (response) {
        setMessages(prev => [...prev, { role: 'model', parts: [{ text: response }] }]);
      }
    } catch (error) {
      console.error('Assistant error:', error);
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: "Sorry, I'm having a bit of trouble connecting right now. Please try again in a moment." }] }]);
    } finally {
      setIsLoading(true);
      setIsLoading(false);
    }
  };

  const handleFindChurches = async () => {
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', parts: [{ text: "Find nearby churches in Soweto" }] }]);
    
    try {
      // Soweto coordinates (Orlando West)
      const location = { lat: -26.2361, lng: 27.9078 };
      const { text, grounding } = await findNearbyChurches(location);
      
      let responseText = text || "I found some churches in Soweto for you:";
      if (grounding.length > 0) {
        responseText += "\n\n**Nearby Locations:**\n" + grounding.map((g: any) => `- [${g.maps?.title || 'Location'}](${g.maps?.uri || '#'})`).join('\n');
      }

      setMessages(prev => [...prev, { role: 'model', parts: [{ text: responseText }] }]);
    } catch (error) {
      console.error('Maps error:', error);
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: "I couldn't access the maps right now. Please try again later." }] }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white w-[400px] h-[600px] rounded-[2.5rem] shadow-2xl border border-black/5 flex flex-col overflow-hidden mb-4"
          >
            {/* Header */}
            <div className="bg-black p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-serif italic text-lg">Legacy Assistant</h3>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">AI Powered Guide</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {messages.length === 0 && (
                <div className="space-y-6">
                  <div className="bg-black/5 p-6 rounded-3xl border border-black/5">
                    <p className="text-sm text-black/60 leading-relaxed italic">
                      "I am here to guide you through the Soweto 50th Anniversary Legacy Process. Ask me about the history of 1976, the different generational cohorts, or how you can get involved."
                    </p>
                  </div>
                  
                  {quickFact && (
                    <div className="flex gap-3 items-start">
                      <div className="w-8 h-8 bg-black/5 rounded-lg flex items-center justify-center shrink-0">
                        <History className="w-4 h-4 text-black/40" />
                      </div>
                      <p className="text-xs text-black/50 italic leading-relaxed">{quickFact}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={handleFindChurches}
                      className="p-4 bg-black/5 rounded-2xl text-left hover:bg-black/10 transition-all group"
                    >
                      <MapPin className="w-4 h-4 mb-2 text-black/40 group-hover:text-black transition-colors" />
                      <div className="text-xs font-medium">Find Nearby Churches</div>
                    </button>
                    <button 
                      onClick={() => setInput("Tell me about the Class of '76")}
                      className="p-4 bg-black/5 rounded-2xl text-left hover:bg-black/10 transition-all group"
                    >
                      <History className="w-4 h-4 mb-2 text-black/40 group-hover:text-black transition-colors" />
                      <div className="text-xs font-medium">The Class of '76</div>
                    </button>
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed",
                    msg.role === 'user' ? "bg-black text-white" : "bg-black/5 text-black/80 prose prose-sm prose-black"
                  )}>
                    <Markdown>{msg.parts[0].text}</Markdown>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-black/5 p-4 rounded-3xl flex gap-1">
                    <div className="w-1.5 h-1.5 bg-black/20 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-black/20 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-black/20 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-6 border-t border-black/5 bg-white">
              <div className="relative">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="w-full pl-6 pr-14 py-4 bg-black/5 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-black/10 transition-all"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center hover:bg-black/90 transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all",
          isOpen ? "bg-white text-black border border-black/5" : "bg-black text-white"
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}

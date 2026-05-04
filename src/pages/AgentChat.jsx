import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Plus, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

const AGENT_NAME = 'candidate_match_analyst';

export default function AgentChat() {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (!activeConversation) return;
    const unsub = base44.agents.subscribeToConversation(activeConversation.id, (data) => {
      setMessages(data.messages || []);
      setSending(false);
    });
    return () => unsub();
  }, [activeConversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    setLoadingConvs(true);
    const convs = await base44.agents.listConversations({ agent_name: AGENT_NAME });
    setConversations(convs || []);
    setLoadingConvs(false);
  };

  const createConversation = async () => {
    const conv = await base44.agents.createConversation({
      agent_name: AGENT_NAME,
      metadata: { name: `שיחה ${new Date().toLocaleDateString('he-IL')} ${new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}` }
    });
    setConversations(prev => [conv, ...prev]);
    setActiveConversation(conv);
    setMessages([]);
  };

  const selectConversation = async (conv) => {
    const full = await base44.agents.getConversation(conv.id);
    setActiveConversation(full);
    setMessages(full.messages || []);
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeConversation || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    await base44.agents.addMessage(activeConversation, { role: 'user', content: text });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-full" dir="rtl">
      {/* Sidebar */}
      <div className="w-64 border-l bg-white flex flex-col" style={{ borderColor: '#E2E8F0' }}>
        <div className="p-4 border-b" style={{ borderColor: '#E2E8F0' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🎯</span>
            <div>
              <p className="font-semibold text-sm text-foreground">אנליסט התאמה</p>
              <p className="text-xs text-muted-foreground">Candidate Match Analyst</p>
            </div>
          </div>
          <Button onClick={createConversation} className="w-full" size="sm">
            <Plus className="w-4 h-4" />
            שיחה חדשה
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingConvs ? (
            <div className="flex justify-center pt-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center pt-8">אין שיחות עדיין</p>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={cn(
                  'w-full text-right px-3 py-2 rounded-lg text-sm transition-colors',
                  activeConversation?.id === conv.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-muted text-foreground'
                )}
              >
                <p className="truncate">{conv.metadata?.name || 'שיחה'}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-background">
        {!activeConversation ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <span className="text-6xl">🎯</span>
            <h2 className="text-xl font-semibold text-foreground">אנליסט התאמת מועמדים</h2>
            <p className="text-muted-foreground max-w-sm text-sm">
              שאל אותי לנתח התאמה בין מועמד למשרה. אני מתייחס לדרישות התפקיד, פרופיל המועמד ותרבות ארגונית.
            </p>
            <Button onClick={createConversation}>
              <Plus className="w-4 h-4" />
              התחל שיחה חדשה
            </Button>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground text-sm pt-8">
                  שלח הודעה כדי להתחיל. לדוגמה: "נתח התאמה בין מועמד [שם] למשרת [תפקיד]"
                </div>
              )}
              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} />
              ))}
              {sending && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-lg">🎯</div>
                  <div className="bg-white border border-border rounded-2xl px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-white" style={{ borderColor: '#E2E8F0' }}>
              <div className="flex gap-2 items-end">
                <Textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="כתוב הודעה... (Enter לשליחה, Shift+Enter לשורה חדשה)"
                  className="resize-none text-sm"
                  rows={2}
                />
                <Button onClick={sendMessage} disabled={!input.trim() || sending} size="icon" className="shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  if (!message.content && !message.tool_calls?.length) return null;

  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-lg shrink-0">🎯</div>
      )}
      <div className={cn('max-w-[80%] rounded-2xl px-4 py-3 text-sm', isUser ? 'bg-primary text-primary-foreground' : 'bg-white border border-border text-foreground')}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
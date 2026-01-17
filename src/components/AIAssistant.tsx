import { MessageSquare, X, Send } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
};

const suggestions = [
  'Tell me about AI solutions',
  'Schedule a consultation',
  'View case studies',
];

const welcomeMessage = "Hello! I'm Digrro's AI assistant. How can I help you today?";

const apiBaseUrl = (import.meta.env.VITE_AI_API_URL as string | undefined) ?? '';
const apiUrl = apiBaseUrl ? `${apiBaseUrl.replace(/\/$/, '')}/api/chat` : '/api/chat';

const createId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', content: welcomeMessage },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const showSuggestions = useMemo(
    () => !messages.some((item) => item.role === 'user'),
    [messages],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isOpen, isLoading, messages]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) {
      return;
    }

    setError(null);
    const newMessage: ChatMessage = {
      id: createId(),
      role: 'user',
      content: trimmed,
    };
    const nextMessages = [...messages, newMessage];
    setMessages(nextMessages);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })).slice(-12),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'AI service error');
      }

      const data = await response.json();
      const reply = typeof data?.reply === 'string' ? data.reply : '';

      if (!reply) {
        throw new Error('Empty response from AI service');
      }

      setMessages((current) => [
        ...current,
        { id: createId(), role: 'assistant', content: reply },
      ]);
    } catch {
      setError('Unable to reach the AI service.');
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: 'assistant',
          content:
            "Sorry, I'm having trouble connecting right now. Please try again or contact us at info@digrro.com.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const statusText = error
    ? 'Offline - check AI server'
    : isLoading
      ? 'Thinking...'
      : 'Online - Ready to help';

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 z-50 p-5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
        >
          <MessageSquare size={28} />
          <div className="absolute top-0 right-0 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-8 right-8 z-50 w-96 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <MessageSquare size={24} className="text-white" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"></div>
              </div>
              <div>
                <h3 className="text-white font-semibold">AI Assistant</h3>
                <p className="text-white/80 text-xs">{statusText}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 p-1.5 rounded-lg transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <div className="h-96 p-4 overflow-y-auto bg-gray-800">
            <div className="space-y-4">
              {messages.map((chat, index) => (
                <div
                  key={chat.id}
                  className={`flex items-start ${
                    chat.role === 'user' ? 'justify-end' : 'space-x-3'
                  }`}
                >
                  {chat.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                      <MessageSquare size={16} className="text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-3 border shadow-sm ${
                      chat.role === 'user'
                        ? 'bg-blue-500/20 border-blue-500/40 text-gray-100'
                        : 'bg-gray-900 border-gray-700 text-gray-200'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {chat.content}
                    </p>
                    {chat.role === 'assistant' && showSuggestions && index === 0 && (
                      <div className="mt-3 space-y-2">
                        {suggestions.map((prompt) => (
                          <button
                            key={prompt}
                            onClick={() => void sendMessage(prompt)}
                            className="block w-full text-left px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm rounded-lg transition-all border border-blue-500/30"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                    <MessageSquare size={16} className="text-white" />
                  </div>
                  <div className="bg-gray-900 rounded-lg p-3 border border-gray-700 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"></span>
                      <span
                        className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      ></span>
                      <span
                        className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      ></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage(message);
            }}
            className="p-4 border-t border-gray-700 bg-gray-900"
          >
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 text-sm focus:outline-none focus:border-blue-400 transition-all"
              />
              <button
                type="submit"
                disabled={isLoading || !message.trim()}
                className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <Send size={20} />
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-2 text-center">
              Powered by Digrro AI
            </p>
          </form>
        </div>
      )}
    </>
  );
}

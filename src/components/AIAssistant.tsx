import { MessageSquare, X, Send } from 'lucide-react';
import { useState } from 'react';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

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
                <p className="text-white/80 text-xs">Online - Ready to help</p>
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
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <MessageSquare size={16} className="text-white" />
                </div>
                <div className="flex-1 bg-gray-900 rounded-lg p-3 border border-gray-700 shadow-sm">
                  <p className="text-gray-200 text-sm leading-relaxed">
                    Hello! I'm Digrro's AI assistant. How can I help you today?
                  </p>
                  <div className="mt-3 space-y-2">
                    <button className="block w-full text-left px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm rounded-lg transition-all border border-blue-500/30">
                      Tell me about AI Solutions
                    </button>
                    <button className="block w-full text-left px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm rounded-lg transition-all border border-blue-500/30">
                      Schedule a consultation
                    </button>
                    <button className="block w-full text-left px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm rounded-lg transition-all border border-blue-500/30">
                      View case studies
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-700 bg-gray-900">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 text-sm focus:outline-none focus:border-blue-400 transition-all"
              />
              <button className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all">
                <Send size={20} />
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-2 text-center">
              Powered by Digrro AI
            </p>
          </div>
        </div>
      )}
    </>
  );
}

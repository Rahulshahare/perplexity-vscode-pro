import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './App.css';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  citations?: string[];
  streaming?: boolean;
}

interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  mode: SearchMode;
}

type SearchMode = 'general' | 'debug' | 'explain' | 'optimize' | 'test' | 'research';

// VSCode API interface
declare global {
  interface Window {
    vscode: {
      postMessage: (message: any) => void;
      setState: (state: any) => void;
      getState: () => any;
    };
  }
}

const App: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>('general');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognition = useRef<SpeechRecognition> || (null);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech recognition is not supported in this browser');
      return;
    }
    
    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = false;
    recognitionInstance.lang = 'en-US';
    
    // Store the instance in the ref
    recognition.current = recognitionInstance;

    // Event handlers with proper typing
    const handleResult = (event: SpeechRecognitionEvent) => {
      try {
        // Safely access results with proper type checking
        const results = event.results;
        if (results && results.length > 0) {
          const result = results[event.resultIndex];
          if (result && !result.isFinal && result.length > 0) {
            const firstAlternative = result[0];
            if (firstAlternative) {
              setInputMessage(firstAlternative.transcript);
            }
          }
        }
      } catch (error) {
        console.error('Error processing speech result:', error);
      } finally {
        setIsRecording(false);
      }
    };

    const handleError = (event: Event) => {
      const e = event as SpeechRecognitionErrorEvent;
      console.error('Speech recognition error:', {
        error: e.error,
        message: e.message,
        type: event.type
      });
      setIsRecording(false);
    };

    const handleEnd = () => {
      setIsRecording(false);
    };

    // Add strongly-typed event listeners
    recognitionInstance.addEventListener('result', handleResult);
    recognitionInstance.addEventListener('error', handleError);
    recognitionInstance.addEventListener('end', handleEnd);

    // Cleanup function
    return () => {
      if (recognitionInstance) {
        // Remove all event listeners
        recognitionInstance.removeEventListener('result', handleResult);
        recognitionInstance.removeEventListener('error', handleError);
        recognitionInstance.removeEventListener('end', handleEnd);
        
        // Safely abort recognition if it's active
        try {
          if ('abort' in recognitionInstance && typeof recognitionInstance.abort === 'function') {
            recognitionInstance.abort();
          }
        } catch (e) {
          console.warn('Error aborting speech recognition:', e);
        }
      }
    };
  }, []);

  // Message from extension
  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      const message = event.data;

      switch (message.type) {
        case 'sessionUpdate':
          if (message.session) {
            setCurrentSession(message.session);
            updateSessionInList(message.session);
          }
          break;
        case 'sessionsUpdate':
          setSessions(message.sessions);
          break;
        case 'configUpdate':
          setTheme(message.config.theme === 'auto' ? 'dark' : message.config.theme);
          setIsVoiceEnabled(message.config.enableVoice);
          break;
        case 'streamingUpdate':
          if (message.session) {
            setCurrentSession(message.session);
          }
          break;
      }
    };

    window.addEventListener('message', messageHandler);
    return () => window.removeEventListener('message', messageHandler);
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  // Request initial data
  useEffect(() => {
    window.vscode.postMessage({ type: 'initialize' });
  }, []);

  const updateSessionInList = useCallback((updatedSession: Session) => {
    setSessions(prev => {
      const index = prev.findIndex(s => s.id === updatedSession.id);
      if (index >= 0) {
        const newSessions = [...prev];
        newSessions[index] = updatedSession;
        return newSessions;
      } else {
        return [updatedSession, ...prev];
      }
    });
  }, []);

  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isLoading) return;

    const message = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    window.vscode.postMessage({
      type: 'sendMessage',
      content: message,
      mode: searchMode
    });
  }, [inputMessage, isLoading, searchMode]);

  const createNewSession = useCallback(() => {
    window.vscode.postMessage({ type: 'newSession', mode: searchMode });
  }, [searchMode]);

  const switchSession = useCallback((sessionId: string) => {
    window.vscode.postMessage({ type: 'switchSession', sessionId });
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    window.vscode.postMessage({ type: 'deleteSession', sessionId });
  }, []);

  const toggleVoiceRecording = useCallback(async () => {
    if (!isVoiceEnabled) {
      console.warn('Voice input is not enabled in settings');
      return;
    }

    if (!recognition.current) {
      console.error('Speech recognition is not available');
      return;
    }

    try {
      if (isRecording) {
        // Stop the current recognition
        if (typeof recognition.current.stop === 'function') {
          recognition.current.stop();
        }
        // The 'end' event will handle setting isRecording to false
      } else {
        // Start new recognition
        if (typeof recognition.current.start === 'function') {
          // Clear any previous input
          setInputMessage('');
          // Start recognition
          recognition.current.start();
          setIsRecording(true);
        } else {
          console.error('Speech recognition start method not available');
        }
      }
    } catch (error) {
      console.error('Error toggling voice recording:', error);
      setIsRecording(false);
      
      // Show error to user if possible
      if (error instanceof Error) {
        window.vscode.postMessage({
          type: 'showError',
          message: `Voice input error: ${error.message}`
        });
      }
    }
  }, [isVoiceEnabled, isRecording]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const searchModeConfig = {
    general: { icon: '💬', label: 'General Chat', color: 'text-blue-400' },
    debug: { icon: '🐛', label: 'Debug Code', color: 'text-red-400' },
    explain: { icon: '📖', label: 'Explain Code', color: 'text-green-400' },
    optimize: { icon: '⚡', label: 'Optimize Code', color: 'text-yellow-400' },
    test: { icon: '🧪', label: 'Generate Tests', color: 'text-purple-400' },
    research: { icon: '🔍', label: 'Research', color: 'text-cyan-400' }
  };

  return (
    <div className={`app ${theme}`}>
      <div className="flex h-screen bg-gray-900 text-white">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-lg font-semibold">Perplexity AI</h1>
              <button
                onClick={createNewSession}
                className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors"
                title="New Chat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {/* Search Mode Selector */}
            <select
              value={searchMode}
              onChange={(e) => setSearchMode(e.target.value as SearchMode)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(searchModeConfig).map(([mode, config]) => (
                <option key={mode} value={mode}>
                  {config.icon} {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`p-3 border-b border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors ${
                  currentSession?.id === session.id ? 'bg-gray-700' : ''
                }`}
                onClick={() => switchSession(session.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs">
                        {searchModeConfig[session.mode]?.icon}
                      </span>
                      <span className="text-sm font-medium truncate">
                        {session.title}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatTimestamp(new Date(session.updatedAt))}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    className="p-1 rounded hover:bg-gray-600 text-gray-400 hover:text-red-400"
                    title="Delete Session"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {currentSession?.messages.filter(m => m.role !== 'system').map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-3xl rounded-lg p-4 ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 border border-gray-700'
                }`}>
                  <div className="flex items-center gap-2 mb-2 text-sm text-gray-300">
                    <span className="font-medium">
                      {message.role === 'user' ? 'You' : 'Perplexity AI'}
                      {message.streaming && ' (typing...)'}
                    </span>
                    <span>•</span>
                    <span>{formatTimestamp(new Date(message.timestamp))}</span>
                  </div>

                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>

                  {message.citations && message.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <div className="text-sm text-gray-400 mb-2">Sources:</div>
                      <div className="space-y-1">
                        {message.citations.map((citation, index) => (
                          <a
                            key={index}
                            href={citation}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-sm text-blue-400 hover:text-blue-300 underline"
                          >
                            [{index + 1}] {citation}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-700 p-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Ask ${searchModeConfig[searchMode].label.toLowerCase()}...`}
                  className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px] max-h-32"
                  rows={1}
                  disabled={isLoading}
                />
              </div>

              {isVoiceEnabled && (
                <button
                  onClick={toggleVoiceRecording}
                  className={`p-3 rounded-lg transition-colors ${
                    isRecording 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  title="Voice Input"
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              )}

              <button
                onClick={sendMessage}
                className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!inputMessage.trim() || isLoading}
                title="Send Message"
              >
                {isLoading ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';
import { PerplexityClient, PerplexityMessage } from '../api/perplexityClient';
import { Logger } from './logger';

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  mode: SearchMode;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  citations?: string[];
  mode?: SearchMode;
  streaming?: boolean;
}

export type SearchMode = 'general' | 'debug' | 'explain' | 'optimize' | 'test' | 'research';

export class ChatManager {
  private context: vscode.ExtensionContext;
  private perplexityClient: PerplexityClient;
  private sessions: Map<string, ChatSession> = new Map();
  private currentSessionId: string | null = null;
  private eventEmitter = new vscode.EventEmitter<ChatSession | null>();

  public readonly onSessionChanged = this.eventEmitter.event;

  constructor(context: vscode.ExtensionContext, perplexityClient: PerplexityClient) {
    this.context = context;
    this.perplexityClient = perplexityClient;
    this.loadSessions();
  }

  public async createNewSession(title?: string, mode: SearchMode = 'general'): Promise<string> {
    const sessionId = uuidv4();
    const session: ChatSession = {
      id: sessionId,
      title: title || 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      mode
    };

    // Add system message based on mode
    const systemMessage = this.getSystemMessage(mode);
    if (systemMessage) {
      session.messages.push({
        id: uuidv4(),
        role: 'system',
        content: systemMessage,
        timestamp: new Date()
      });
    }

    this.sessions.set(sessionId, session);
    this.currentSessionId = sessionId;

    await this.saveSessions();
    this.eventEmitter.fire(session);

    Logger.info(`Created new chat session: ${sessionId} (${mode})`);
    return sessionId;
  }

  public async sendMessage(
    content: string, 
    mode: SearchMode = 'general'
  ): Promise<ChatMessage> {
    if (!this.currentSessionId) {
      await this.createNewSession('New Chat', mode);
    }

    const session = this.sessions.get(this.currentSessionId!);
    if (!session) {
      throw new Error('No active session found');
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date(),
      mode
    };

    session.messages.push(userMessage);
    session.updatedAt = new Date();
    session.mode = mode;

    // Update session title if this is the first user message
    if (session.messages.filter(m => m.role === 'user').length === 1) {
      session.title = this.generateSessionTitle(content);
    }

    try {
      // Prepare messages for API
      const apiMessages = this.prepareMessagesForAPI(session.messages, mode);

      // Create assistant message placeholder
      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        streaming: true
      };

      session.messages.push(assistantMessage);
      this.eventEmitter.fire(session);

      // Stream response
      let fullContent = '';
      const citations: string[] = [];

      for await (const chunk of this.perplexityClient.streamChatCompletion(apiMessages)) {
        if (chunk.choices && chunk.choices[0]) {
          const delta = chunk.choices[0].delta;
          if (delta?.content) {
            fullContent += delta.content;
            assistantMessage.content = fullContent;
            assistantMessage.streaming = true;
            this.eventEmitter.fire(session);
          }
        }

        // Collect citations
        if (chunk.citations) {
          citations.push(...chunk.citations);
        }
      }

      // Finalize assistant message
      assistantMessage.content = fullContent;
      assistantMessage.citations = citations.length > 0 ? Array.from(new Set(citations)) : undefined;
      assistantMessage.streaming = false;

      session.updatedAt = new Date();
      await this.saveSessions();
      this.eventEmitter.fire(session);

      Logger.debug(`Message sent and response received for session: ${session.id}`);
      return assistantMessage;

    } catch (error) {
      Logger.error('Failed to send message:', error);

      // Remove the placeholder assistant message on error
      if (session.messages.length > 0) {
        const lastMessage = session.messages[session.messages.length - 1];
        if (lastMessage) {
          session.messages = session.messages.filter(m => m.id !== lastMessage.id);
        }
      }

      // Add error message
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp: new Date()
      };

      session.messages.push(errorMessage);
      this.eventEmitter.fire(session);

      throw error;
    }
  }

  public getCurrentSession(): ChatSession | null {
    if (!this.currentSessionId) {
      return null;
    }
    const session = this.sessions.get(this.currentSessionId);
    return session ? { ...session } : null;
  }

  public getSession(sessionId: string): ChatSession | null {
    const session = this.sessions.get(sessionId);
    return session ? { ...session } : null;
  }

  public getAllSessions(): ChatSession[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  public async switchToSession(sessionId: string): Promise<void> {
    if (!sessionId || typeof sessionId !== 'string') {
      throw new Error('Session ID must be a non-empty string');
    }
    
    const session = this.sessions.get(sessionId);
    if (!session || typeof session !== 'object') {
      throw new Error(`Session not found: ${sessionId}`);
    }
    
    // Ensure the session has all required properties
    const validSession: ChatSession = {
      id: session.id || uuidv4(),
      title: session.title || 'Untitled',
      messages: Array.isArray(session.messages) ? session.messages : [],
      createdAt: session.createdAt instanceof Date ? session.createdAt : new Date(),
      updatedAt: session.updatedAt instanceof Date ? session.updatedAt : new Date(),
      mode: session.mode || 'general'
    };
    
    this.currentSessionId = validSession.id;
    this.eventEmitter.fire(validSession);
    Logger.debug(`Switched to session: ${validSession.id}`);
  }

  public async deleteSession(sessionId: string): Promise<void> {
    if (!sessionId || !this.sessions.has(sessionId)) {
      return;
    }
    
    const sessionToDelete = this.sessions.get(sessionId);
    if (!sessionToDelete) {
      return;
    }
    
    this.sessions.delete(sessionId);
    
    if (this.currentSessionId === sessionId) {
      const remainingSessions = this.getAllSessions();
      this.currentSessionId = remainingSessions.length > 0 && remainingSessions[0] ? 
        remainingSessions[0].id : 
        null;
    }

    await this.saveSessions();
    const currentSession = this.getCurrentSession();
    if (currentSession) {
      this.eventEmitter.fire({ ...currentSession });
    } else {
      this.eventEmitter.fire(null);
    }
    Logger.debug(`Deleted session: ${sessionId}`);
  }

  public async clearAllSessions(): Promise<void> {
    this.sessions.clear();
    this.currentSessionId = null;
    await this.saveSessions();
    this.eventEmitter.fire(null);
    Logger.info('Cleared all chat sessions');
  }

  private getSystemMessage(mode: SearchMode): string | null {
    const systemMessages = {
      general: 'You are a helpful AI assistant. Provide accurate, concise, and well-structured responses.',
      debug: 'You are an expert code debugger. Help identify issues, explain problems clearly, and suggest specific fixes.',
      explain: 'You are a code explanation expert. Break down code into understandable parts and explain concepts clearly.',
      optimize: 'You are a code optimization expert. Focus on performance improvements, best practices, and cleaner code structure.',
      test: 'You are a testing expert. Generate comprehensive, well-structured unit tests with good coverage.',
      research: 'You are a research assistant. Provide thorough, well-cited information with reliable sources.'
    };

    return systemMessages[mode] || null;
  }

  private prepareMessagesForAPI(messages: ChatMessage[], mode: SearchMode): PerplexityMessage[] {
    // Filter out streaming placeholders and convert to API format
    return messages
      .filter((m): m is ChatMessage => 
        !!m && 
        !m.streaming && 
        typeof m.content === 'string' && 
        m.content.trim() !== '' &&
        ['user', 'assistant', 'system'].includes(m.role)
      )
      .map(m => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content
      }));
  }

  private generateSessionTitle(firstMessage: string): string {
    // Generate a concise title from the first message
    const words = firstMessage.trim().split(/\s+/);
    if (words.length <= 5) {
      return firstMessage;
    }
    return words.slice(0, 5).join(' ') + '...';
  }

  private async loadSessions(): Promise<void> {
    try {
      const sessionsData = this.context.globalState.get<any[]>('perplexityChat.sessions', []);

      this.sessions.clear();
      for (const sessionData of sessionsData) {
        if (sessionData && sessionData.id) {
          const session: ChatSession = {
            id: sessionData.id,
            title: sessionData.title || 'Untitled',
            messages: Array.isArray(sessionData.messages) 
              ? sessionData.messages
                  .filter((msg: any) => msg && msg.id && msg.role && msg.content)
                  .map((msg: any) => ({
                    id: msg.id,
                    role: msg.role,
                    content: msg.content,
                    timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
                    citations: Array.isArray(msg.citations) ? msg.citations : [],
                    mode: msg.mode || 'general',
                    streaming: Boolean(msg.streaming)
                  }))
              : [],
            createdAt: sessionData.createdAt ? new Date(sessionData.createdAt) : new Date(),
            updatedAt: sessionData.updatedAt ? new Date(sessionData.updatedAt) : new Date(),
            mode: sessionData.mode || 'general'
          };
          this.sessions.set(session.id, session);
        }
      }

      // Set current session to the most recent one
      const sessions = this.getAllSessions();
      if (sessions.length > 0 && sessions[0]) {
        this.currentSessionId = sessions[0].id;
      }

      Logger.debug(`Loaded ${this.sessions.size} chat sessions`);
    } catch (error) {
      Logger.error('Failed to load sessions:', error);
    }
  }

  private async saveSessions(): Promise<void> {
    try {
      const sessionsData: ChatSession[] = [];
      
      for (const [id, session] of this.sessions.entries()) {
        if (!session || !id || typeof session.id !== 'string' || !Array.isArray(session.messages)) {
          continue;
        }
        
        const validMessages: ChatMessage[] = [];
        for (const message of session.messages) {
          if (message && 
              typeof message.id === 'string' && 
              ['user', 'assistant', 'system'].includes(message.role) &&
              typeof message.content === 'string' &&
              message.timestamp instanceof Date) {
            validMessages.push(message);
          }
        }
        
        sessionsData.push({
          id: session.id,
          title: session.title || 'Untitled',
          messages: validMessages,
          createdAt: session.createdAt || new Date(),
          updatedAt: session.updatedAt || new Date(),
          mode: session.mode || 'general'
        });
      }
      
      await this.context.globalState.update(
        'perplexityChat.sessions', 
        sessionsData
      );
      Logger.debug(`Saved ${sessionsData.length} chat sessions`);
    } catch (error) {
      Logger.error('Failed to save sessions:', error);
    }
  }

  public dispose(): void {
    this.eventEmitter.dispose();
  }
}

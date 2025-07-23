import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ConfigManager } from '../utils/config';
import { Logger } from '../utils/logger';

export interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface PerplexityResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    finish_reason: string;
    message: PerplexityMessage;
    delta?: Partial<PerplexityMessage>;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  citations?: string[];
}

export interface ChatCompletionRequest {
  model: string;
  messages: PerplexityMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  search_domain_filter?: string[];
  search_recency_filter?: 'month' | 'week' | 'day' | 'hour';
}

export class PerplexityClient {
  private httpClient: AxiosInstance;
  private config: ConfigManager;

  constructor(config: ConfigManager) {
    this.config = config;
    this.httpClient = this.createHttpClient();
  }

  private createHttpClient(): AxiosInstance {
    const client = axios.create({
      baseURL: 'https://api.perplexity.ai',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'VSCode-Perplexity-Extension/1.0.0'
      }
    });

    // Request interceptor for authentication
    client.interceptors.request.use(
      (config) => {
        const apiKey = this.config.getApiKey();
        if (apiKey) {
          config.headers.Authorization = `Bearer ${apiKey}`;
        }
        return config;
      },
      (error) => {
        Logger.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    client.interceptors.response.use(
      (response) => response,
      (error) => {
        Logger.error('API request failed:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );

    return client;
  }

  public updateConfig(config: ConfigManager): void {
    this.config = config;
    // Recreate HTTP client with new config
    this.httpClient = this.createHttpClient();
  }

  public async chatCompletion(
    messages: PerplexityMessage[],
    options: Partial<ChatCompletionRequest> = {}
  ): Promise<PerplexityResponse> {
    try {
      const request: ChatCompletionRequest = {
        model: options.model || this.config.getModel(),
        messages,
        temperature: options.temperature ?? this.config.getTemperature(),
        max_tokens: options.max_tokens ?? this.config.getMaxTokens(),
        stream: false,
        ...options
      };

      Logger.debug('Sending chat completion request:', { 
        model: request.model,
        messageCount: messages.length,
        temperature: request.temperature,
        maxTokens: request.max_tokens
      });

      const response: AxiosResponse<PerplexityResponse> = await this.httpClient.post(
        '/chat/completions',
        request
      );

      Logger.debug('Received chat completion response:', {
        id: response.data.id,
        model: response.data.model,
        tokensUsed: response.data.usage?.total_tokens
      });

      return response.data;
    } catch (error) {
      Logger.error('Chat completion failed:', error);
      throw this.handleApiError(error);
    }
  }

  public async *streamChatCompletion(
    messages: PerplexityMessage[],
    options: Partial<ChatCompletionRequest> = {}
  ): AsyncGenerator<PerplexityResponse, void, unknown> {
    try {
      const request: ChatCompletionRequest = {
        model: options.model || this.config.getModel(),
        messages,
        temperature: options.temperature ?? this.config.getTemperature(),
        max_tokens: options.max_tokens ?? this.config.getMaxTokens(),
        stream: true,
        ...options
      };

      Logger.debug('Starting streaming chat completion:', {
        model: request.model,
        messageCount: messages.length
      });

      const response = await this.httpClient.post('/chat/completions', request, {
        responseType: 'stream',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        }
      });

      const stream = response.data;
      let buffer = '';

      for await (const chunk of stream) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed: PerplexityResponse = JSON.parse(data);
              yield parsed;
            } catch (parseError) {
              Logger.warn('Failed to parse streaming response:', parseError);
            }
          }
        }
      }
    } catch (error) {
      Logger.error('Streaming chat completion failed:', error);
      throw this.handleApiError(error);
    }
  }

  public async validateApiKey(): Promise<boolean> {
    try {
      const testMessages: PerplexityMessage[] = [
        { role: 'user', content: 'Hello' }
      ];

      await this.chatCompletion(testMessages, { max_tokens: 1 });
      return true;
    } catch (error) {
      Logger.error('API key validation failed:', error);
      return false;
    }
  }

  private handleApiError(error: any): Error {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 401:
          return new Error('Invalid API key. Please check your Perplexity API key in settings.');
        case 429:
          return new Error('Rate limit exceeded. Please try again later.');
        case 500:
          return new Error('Perplexity server error. Please try again later.');
        default:
          return new Error(`API error (${status}): ${data?.error?.message || 'Unknown error'}`);
      }
    } else if (error.code === 'ECONNABORTED') {
      return new Error('Request timeout. Please check your internet connection.');
    } else {
      return new Error(`Connection error: ${error.message}`);
    }
  }

  public getModels(): string[] {
    return [
      'llama-3.1-sonar-small-128k-online',
      'llama-3.1-sonar-large-128k-online',
      'llama-3.1-sonar-huge-128k-online',
      'llama-3.1-sonar-small-128k-chat',
      'llama-3.1-sonar-large-128k-chat'
    ];
  }
}

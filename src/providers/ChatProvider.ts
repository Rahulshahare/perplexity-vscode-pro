import * as vscode from 'vscode';
import { ChatManager, ChatSession } from '../utils/chatManager';
import { Logger } from '../utils/logger';

export class ChatProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'perplexityChat.chatView';

  private webview?: vscode.Webview;
  private chatManager: ChatManager;

  constructor(
    private readonly extensionUri: vscode.Uri,
    chatManager: ChatManager
  ) {
    this.chatManager = chatManager;

    // Listen to chat manager events
    this.chatManager.onSessionChanged((session) => {
      this.sendToWebview({
        type: 'sessionUpdate',
        session: session ? this.serializeSession(session) : null
      });
    });
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    this.webview = webviewView.webview;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        this.extensionUri
      ]
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage(
      async (data) => {
        await this.handleWebviewMessage(data);
      },
      undefined,
      []
    );

    // Send initial configuration
    this.sendInitialData();

    Logger.debug('Webview resolved and initialized');
  }

  private async handleWebviewMessage(data: any): Promise<void> {
    try {
      switch (data.type) {
        case 'initialize':
          await this.sendInitialData();
          break;

        case 'sendMessage':
          if (data.content) {
            await this.chatManager.sendMessage(data.content, data.mode || 'general');
          }
          break;

        case 'newSession':
          await this.chatManager.createNewSession(undefined, data.mode || 'general');
          break;

        case 'switchSession':
          if (data.sessionId) {
            await this.chatManager.switchToSession(data.sessionId);
          }
          break;

        case 'deleteSession':
          if (data.sessionId) {
            await this.chatManager.deleteSession(data.sessionId);
            await this.sendSessionsList();
          }
          break;

        case 'clearAllSessions':
          await this.chatManager.clearAllSessions();
          await this.sendSessionsList();
          break;

        default:
          Logger.warn('Unknown webview message type:', data.type);
          break;
      }
    } catch (error) {
      Logger.error('Error handling webview message:', error);
      this.sendToWebview({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  private async sendInitialData(): Promise<void> {
    try {
      // Send current session
      const currentSession = this.chatManager.getCurrentSession();
      this.sendToWebview({
        type: 'sessionUpdate',
        session: currentSession ? this.serializeSession(currentSession) : null
      });

      // Send all sessions
      await this.sendSessionsList();

      // Send configuration
      await this.sendConfiguration();

      Logger.debug('Initial data sent to webview');
    } catch (error) {
      Logger.error('Error sending initial data:', error);
    }
  }

  private async sendSessionsList(): Promise<void> {
    const sessions = this.chatManager.getAllSessions();
    this.sendToWebview({
      type: 'sessionsUpdate',
      sessions: sessions.map(session => this.serializeSession(session))
    });
  }

  private async sendConfiguration(): Promise<void> {
    const config = vscode.workspace.getConfiguration('perplexityChat');
    this.sendToWebview({
      type: 'configUpdate',
      config: {
        theme: config.get('theme', 'auto'),
        enableVoice: config.get('enableVoice', true),
        model: config.get('model', 'llama-3.1-sonar-small-128k-online'),
        temperature: config.get('temperature', 0.2),
        maxTokens: config.get('maxTokens', 4096)
      }
    });
  }

  private serializeSession(session: ChatSession): any {
    return {
      id: session.id,
      title: session.title,
      messages: session.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
        citations: msg.citations,
        streaming: msg.streaming
      })),
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      mode: session.mode
    };
  }

  private sendToWebview(message: any): void {
    if (this.webview) {
      this.webview.postMessage(message);
    }
  }

  public refresh(): void {
    if (this.webview) {
      this.sendInitialData();
    }
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    // Get the local path to main script run in the webview
    const scriptPathOnDisk = vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview', 'webview.js');
    const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

    // Get the local path to CSS file
    const stylePathOnDisk = vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview', 'style.css');
    const styleUri = webview.asWebviewUri(stylePathOnDisk);

    // Use a nonce to only allow specific scripts to be run
    const nonce = this.getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">

        <!-- Use a content security policy to only allow loading images from https or from our extension directory, 
             and only allow scripts that have a specific nonce. -->
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; 
              style-src ${webview.cspSource} 'unsafe-inline'; 
              img-src ${webview.cspSource} https: data:; 
              script-src 'nonce-${nonce}';
              font-src ${webview.cspSource};
              connect-src https:;">

        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <link href="${styleUri}" rel="stylesheet">

        <title>Perplexity AI Chat</title>

        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            overflow: hidden;
          }

          #root {
            height: 100vh;
            width: 100vw;
          }
        </style>
    </head>
    <body>
        <div id="root"></div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>`;
  }

  private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}

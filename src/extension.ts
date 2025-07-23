import * as vscode from 'vscode';
import { ChatProvider } from './providers/ChatProvider';
import { PerplexityClient } from './api/perplexityClient';
import { ChatManager } from './utils/chatManager';
import { Logger } from './utils/logger';
import { ConfigManager } from './utils/config';

/**
 * Extension activation function called when VSCode loads the extension
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  try {
    Logger.info('🚀 Activating Perplexity AI Chat Pro extension...');

    // Initialize configuration manager
    const configManager = new ConfigManager();

    // Initialize Perplexity API client
    const perplexityClient = new PerplexityClient(configManager);

    // Initialize chat manager
    const chatManager = new ChatManager(context, perplexityClient);

    // Initialize chat provider for webview
    const chatProvider = new ChatProvider(context.extensionUri, chatManager);

    // Register webview provider
    const webviewProvider = vscode.window.registerWebviewViewProvider(
      'perplexityChat.chatView',
      chatProvider,
      {
        webviewOptions: {
          retainContextWhenHidden: true
        }
      }
    );

    // Register commands
    const commands = [
      // Main chat commands
      vscode.commands.registerCommand('perplexityChat.openChat', async () => {
        await vscode.commands.executeCommand('perplexityChat.chatView.focus');
      }),

      vscode.commands.registerCommand('perplexityChat.newSession', async () => {
        await chatManager.createNewSession();
        chatProvider.refresh();
      }),

      // Code analysis commands
      vscode.commands.registerCommand('perplexityChat.explainCode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          vscode.window.showWarningMessage('No active editor found');
          return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (!selectedText) {
          vscode.window.showWarningMessage('Please select code to explain');
          return;
        }

        const language = editor.document.languageId;
        const prompt = `Explain this ${language} code:\n\n\`\`\`${language}\n${selectedText}\n\`\`\``;

        await chatManager.sendMessage(prompt, 'explain');
        await vscode.commands.executeCommand('perplexityChat.chatView.focus');
      }),

      vscode.commands.registerCommand('perplexityChat.debugCode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          vscode.window.showWarningMessage('No active editor found');
          return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (!selectedText) {
          vscode.window.showWarningMessage('Please select code to debug');
          return;
        }

        const language = editor.document.languageId;
        const prompt = `Help me debug this ${language} code. Identify potential issues and suggest fixes:\n\n\`\`\`${language}\n${selectedText}\n\`\`\``;

        await chatManager.sendMessage(prompt, 'debug');
        await vscode.commands.executeCommand('perplexityChat.chatView.focus');
      }),

      vscode.commands.registerCommand('perplexityChat.optimizeCode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          vscode.window.showWarningMessage('No active editor found');
          return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (!selectedText) {
          vscode.window.showWarningMessage('Please select code to optimize');
          return;
        }

        const language = editor.document.languageId;
        const prompt = `Optimize this ${language} code for better performance and readability:\n\n\`\`\`${language}\n${selectedText}\n\`\`\``;

        await chatManager.sendMessage(prompt, 'optimize');
        await vscode.commands.executeCommand('perplexityChat.chatView.focus');
      }),

      vscode.commands.registerCommand('perplexityChat.generateTests', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          vscode.window.showWarningMessage('No active editor found');
          return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (!selectedText) {
          vscode.window.showWarningMessage('Please select code to generate tests for');
          return;
        }

        const language = editor.document.languageId;
        const prompt = `Generate comprehensive unit tests for this ${language} code:\n\n\`\`\`${language}\n${selectedText}\n\`\`\``;

        await chatManager.sendMessage(prompt, 'test');
        await vscode.commands.executeCommand('perplexityChat.chatView.focus');
      })
    ];

    // Add all disposables to context
    context.subscriptions.push(
      webviewProvider,
      ...commands,
      // Configuration change listener
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('perplexityChat')) {
          configManager.reload();
          perplexityClient.updateConfig(configManager);
        }
      })
    );

    Logger.info('✅ Perplexity AI Chat Pro extension activated successfully');

    // Show welcome message on first activation
    const isFirstTime = context.globalState.get('perplexityChat.firstTime', true);
    if (isFirstTime) {
      await context.globalState.update('perplexityChat.firstTime', false);
      vscode.window.showInformationMessage(
        'Welcome to Perplexity AI Chat Pro! Configure your API key in settings to get started.',
        'Open Settings'
      ).then((selection) => {
        if (selection === 'Open Settings') {
          vscode.commands.executeCommand('workbench.action.openSettings', 'perplexityChat');
        }
      });
    }

  } catch (error) {
    Logger.error('Failed to activate extension:', error);
    vscode.window.showErrorMessage('Failed to activate Perplexity AI Chat Pro extension');
  }
}

/**
 * Extension deactivation function called when VSCode unloads the extension
 */
export function deactivate(): void {
  Logger.info('🔄 Deactivating Perplexity AI Chat Pro extension...');
  // Cleanup is handled automatically by VSCode through disposables
}

import * as vscode from 'vscode';
import { Logger } from './logger';

export class ConfigManager {
  private static readonly CONFIG_SECTION = 'perplexityChat';

  private config: vscode.WorkspaceConfiguration;

  constructor() {
    this.config = vscode.workspace.getConfiguration(ConfigManager.CONFIG_SECTION);
  }

  public reload(): void {
    this.config = vscode.workspace.getConfiguration(ConfigManager.CONFIG_SECTION);
    Logger.debug('Configuration reloaded');
  }

  public getApiKey(): string {
    const apiKey = this.config.get<string>('apiKey', '');
    if (!apiKey) {
      Logger.warn('API key not configured');
    }
    return apiKey;
  }

  public async setApiKey(apiKey: string): Promise<void> {
    await this.config.update('apiKey', apiKey, vscode.ConfigurationTarget.Global);
    Logger.debug('API key updated');
  }

  public getModel(): string {
    return this.config.get<string>('model', 'llama-3.1-sonar-small-128k-online');
  }

  public async setModel(model: string): Promise<void> {
    await this.config.update('model', model, vscode.ConfigurationTarget.Global);
    Logger.debug('Model updated to:', model);
  }

  public getTemperature(): number {
    const temp = this.config.get<number>('temperature', 0.2);
    return Math.max(0, Math.min(2, temp)); // Clamp between 0 and 2
  }

  public async setTemperature(temperature: number): Promise<void> {
    const clampedTemp = Math.max(0, Math.min(2, temperature));
    await this.config.update('temperature', clampedTemp, vscode.ConfigurationTarget.Global);
    Logger.debug('Temperature updated to:', clampedTemp);
  }

  public getMaxTokens(): number {
    const maxTokens = this.config.get<number>('maxTokens', 4096);
    return Math.max(1, Math.min(128000, maxTokens)); // Clamp between 1 and 128k
  }

  public async setMaxTokens(maxTokens: number): Promise<void> {
    const clampedTokens = Math.max(1, Math.min(128000, maxTokens));
    await this.config.update('maxTokens', clampedTokens, vscode.ConfigurationTarget.Global);
    Logger.debug('Max tokens updated to:', clampedTokens);
  }

  public isVoiceEnabled(): boolean {
    return this.config.get<boolean>('enableVoice', true);
  }

  public async setVoiceEnabled(enabled: boolean): Promise<void> {
    await this.config.update('enableVoice', enabled, vscode.ConfigurationTarget.Global);
    Logger.debug('Voice enabled updated to:', enabled);
  }

  public isAutoSaveEnabled(): boolean {
    return this.config.get<boolean>('autoSave', true);
  }

  public async setAutoSaveEnabled(enabled: boolean): Promise<void> {
    await this.config.update('autoSave', enabled, vscode.ConfigurationTarget.Global);
    Logger.debug('Auto save updated to:', enabled);
  }

  public getTheme(): 'auto' | 'dark' | 'light' {
    return this.config.get<'auto' | 'dark' | 'light'>('theme', 'auto');
  }

  public async setTheme(theme: 'auto' | 'dark' | 'light'): Promise<void> {
    await this.config.update('theme', theme, vscode.ConfigurationTarget.Global);
    Logger.debug('Theme updated to:', theme);
  }

  public getAllSettings(): Record<string, any> {
    return {
      apiKey: this.getApiKey() ? '***' : '', // Mask API key in logs
      model: this.getModel(),
      temperature: this.getTemperature(),
      maxTokens: this.getMaxTokens(),
      enableVoice: this.isVoiceEnabled(),
      autoSave: this.isAutoSaveEnabled(),
      theme: this.getTheme()
    };
  }

  public async resetToDefaults(): Promise<void> {
    const updates = [
      this.config.update('model', 'llama-3.1-sonar-small-128k-online', vscode.ConfigurationTarget.Global),
      this.config.update('temperature', 0.2, vscode.ConfigurationTarget.Global),
      this.config.update('maxTokens', 4096, vscode.ConfigurationTarget.Global),
      this.config.update('enableVoice', true, vscode.ConfigurationTarget.Global),
      this.config.update('autoSave', true, vscode.ConfigurationTarget.Global),
      this.config.update('theme', 'auto', vscode.ConfigurationTarget.Global)
    ];

    await Promise.all(updates);
    this.reload();
    Logger.info('Configuration reset to defaults');
  }

  public validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check API key
    if (!this.getApiKey()) {
      errors.push('API key is required');
    }

    // Check temperature range
    const temp = this.config.get<number>('temperature');
    if (temp !== undefined && (temp < 0 || temp > 2)) {
      errors.push('Temperature must be between 0 and 2');
    }

    // Check max tokens range
    const maxTokens = this.config.get<number>('maxTokens');
    if (maxTokens !== undefined && (maxTokens < 1 || maxTokens > 128000)) {
      errors.push('Max tokens must be between 1 and 128000');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

import * as vscode from 'vscode';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export class Logger {
  private static outputChannel: vscode.OutputChannel | undefined;
  private static logLevel: LogLevel = LogLevel.INFO;

  private static getOutputChannel(): vscode.OutputChannel {
    if (!Logger.outputChannel) {
      Logger.outputChannel = vscode.window.createOutputChannel('Perplexity AI Chat Pro');
    }
    return Logger.outputChannel;
  }

  public static setLogLevel(level: LogLevel): void {
    Logger.logLevel = level;
  }

  private static shouldLog(level: LogLevel): boolean {
    return level >= Logger.logLevel;
  }

  private static formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? ` ${JSON.stringify(args)}` : '';
    return `[${timestamp}] [${level}] ${message}${formattedArgs}`;
  }

  public static debug(message: string, ...args: any[]): void {
    if (Logger.shouldLog(LogLevel.DEBUG)) {
      const formatted = Logger.formatMessage('DEBUG', message, ...args);
      Logger.getOutputChannel().appendLine(formatted);
      console.debug(formatted);
    }
  }

  public static info(message: string, ...args: any[]): void {
    if (Logger.shouldLog(LogLevel.INFO)) {
      const formatted = Logger.formatMessage('INFO', message, ...args);
      Logger.getOutputChannel().appendLine(formatted);
      console.info(formatted);
    }
  }

  public static warn(message: string, ...args: any[]): void {
    if (Logger.shouldLog(LogLevel.WARN)) {
      const formatted = Logger.formatMessage('WARN', message, ...args);
      Logger.getOutputChannel().appendLine(formatted);
      console.warn(formatted);
    }
  }

  public static error(message: string, error?: any, ...args: any[]): void {
    if (Logger.shouldLog(LogLevel.ERROR)) {
      let errorDetails = '';
      if (error instanceof Error) {
        errorDetails = ` Error: ${error.message}\\nStack: ${error.stack}`;
      } else if (error) {
        errorDetails = ` Error: ${JSON.stringify(error)}`;
      }
      
      const formatted = Logger.formatMessage('ERROR', message + errorDetails, ...args);
      Logger.getOutputChannel().appendLine(formatted);
      console.error(formatted);
    }
  }

  public static show(): void {
    Logger.getOutputChannel().show();
  }

  public static clear(): void {
    Logger.getOutputChannel().clear();
  }

  public static dispose(): void {
    if (Logger.outputChannel) {
      Logger.outputChannel.dispose();
      Logger.outputChannel = undefined;
    }
  }
}
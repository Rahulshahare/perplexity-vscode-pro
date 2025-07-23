// src/types/speech-recognition.d.ts

declare global {
    interface SpeechRecognition extends EventTarget {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      start(): void;
      stop(): void;
      abort(): void;
      addEventListener(type: 'result', listener: (event: SpeechRecognitionEvent) => void): void;
      addEventListener(type: 'error', listener: (event: SpeechRecognitionErrorEvent) => void): void;
      addEventListener(type: 'end', listener: () => void): void;
      removeEventListener(type: 'result', listener: (event: SpeechRecognitionEvent) => void): void;
      removeEventListener(type: 'error', listener: (event: SpeechRecognitionErrorEvent) => void): void;
      removeEventListener(type: 'end', listener: () => void): void;
    }
  
    interface SpeechRecognitionEvent extends Event {
      results: SpeechRecognitionResultList;
      resultIndex: number;
    }
  
    interface SpeechRecognitionResultList {
      length: number;
      item(index: number): SpeechRecognitionResult;
      [index: number]: SpeechRecognitionResult;
    }
  
    interface SpeechRecognitionResult {
      isFinal: boolean;
      length: number;
      item(index: number): SpeechRecognitionAlternative;
      [index: number]: SpeechRecognitionAlternative;
    }
  
    interface SpeechRecognitionAlternative {
      transcript: string;
      confidence: number;
    }
  
    interface SpeechRecognitionErrorEvent extends Event {
      error: string;
      message: string;
    }
  
    interface SpeechRecognitionStatic {
      new(): SpeechRecognition;
    }
  
    interface Window {
      SpeechRecognition: SpeechRecognitionStatic | undefined;
      webkitSpeechRecognition: SpeechRecognitionStatic | undefined;
      vscode: {
        postMessage: (message: any) => void;
        setState: (state: any) => void;
        getState: () => any;
      };
    }
  }
  
  export {};
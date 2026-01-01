
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_KEY: string;
    }
  }
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export {};

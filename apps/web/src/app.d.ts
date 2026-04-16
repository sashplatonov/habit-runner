declare global {
  const __BUILD_TIME__: string;

  namespace App {
    interface Error {
      message: string;
      code?: string;
    }
  }
}

export {};
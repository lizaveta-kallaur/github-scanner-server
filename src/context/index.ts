export interface Context {
  callsCount: 0;
}

export const context = async (): Promise<Context> => ({ callsCount: 0 });

export interface Context {
  lazyFields: Map<string, Set<string>>;
}

export const context = async (): Promise<Context> => ({
  lazyFields: new Map(),
});

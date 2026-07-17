import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';

// antd's nested component trees re-render heavily under jsdom; the 1s default is too tight
// for waitFor/findBy polling once a few mutation round-trips are chained together.
configure({ asyncUtilTimeout: 5000 });

// Node 22's built-in `localStorage` global shadows jsdom's working implementation and throws
// without a --localstorage-file flag. zustand's persist middleware needs a real one, so force ours.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true });
Object.defineProperty(window, 'localStorage', { value: globalThis.localStorage, configurable: true });

// jsdom doesn't implement these, but antd's internals (Grid breakpoints, Collapse/Drawer motion) call them.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
}

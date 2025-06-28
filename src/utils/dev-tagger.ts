import type { Plugin } from 'vite';

export function devTagger(): Plugin {
  return {
    name: 'dev-component-tagger',
    transform(code: string, id: string) {
      if (!id.includes('node_modules') && (id.endsWith('.tsx') || id.endsWith('.jsx'))) {
        return {
          code: code.replace(
            /(<[A-Z][A-Za-z0-9]*)/g,
            (match) => `${match} data-component="${match.slice(1)}"`
          ),
          map: null
        };
      }
    }
  };
} 
import {
  ɵresolveComponentResources as resolveComponentResources,
} from '@angular/core';
import { readFileSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

const SRC_DIR = resolve(process.cwd(), 'src');

function findFilePath(fileName: string): string {
  const search = (dir: string): string | null => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const result = search(join(dir, entry.name));
        if (result) return result;
      } else if (entry.name === fileName) {
        return join(dir, entry.name);
      }
    }
    return null;
  };
  const found = search(SRC_DIR);
  if (!found) throw new Error(`Cannot resolve Angular resource: ${fileName}`);
  return found;
}

export async function resolveTestResources(): Promise<void> {
  (globalThis as any).fetch = (url: string | URL | Request): Promise<Response> => {
    const urlString = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
    const fileName = urlString.split('/').pop()!;
    const filePath = findFilePath(fileName);
    const content = readFileSync(filePath, 'utf-8');
    return Promise.resolve(new Response(content, { status: 200 }));
  };
  await resolveComponentResources(globalThis.fetch);
}

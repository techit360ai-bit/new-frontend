import { diffIndices, mergeDiff3 } from 'node-diff3';
import type { CodeHunk } from './api/codeWorkspace';

export async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function buildReviewHunks(path: string, baseline: string, proposed: string): Promise<CodeHunk[]> {
  const original = baseline.split('\n');
  const changed = proposed.split('\n');
  return Promise.all(diffIndices(original, changed).map(async (part, index) => {
    const replacement = part.buffer2Content.join('\n');
    return { id: (await sha256(`${path}:${part.buffer1[0]}:${part.buffer1[1]}:${replacement}`)).slice(0, 24), oldStart: part.buffer1[0], oldEnd: part.buffer1[0] + part.buffer1[1], replacement };
  }));
}

export function applyAcceptedHunks(baseline: string, hunks: CodeHunk[], accepted: Set<string>): string {
  const lines = baseline.split('\n');
  for (const hunk of hunks.filter(row => accepted.has(row.id)).sort((a, b) => b.oldStart - a.oldStart)) lines.splice(hunk.oldStart, hunk.oldEnd - hunk.oldStart, ...(hunk.replacement === '' ? [] : hunk.replacement.split('\n')));
  return lines.join('\n');
}

export function threeWayMerge(base: string, local: string, remote: string): { content: string; conflict: boolean } {
  const result = mergeDiff3(local.split('\n'), base.split('\n'), remote.split('\n'), { label: { a: 'TECHIT LOCAL', o: 'COMMON BASE', b: 'REMOTE' }, excludeFalseConflicts: true });
  return { content: result.result.join('\n'), conflict: result.conflict };
}

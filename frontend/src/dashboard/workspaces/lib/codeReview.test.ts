import { describe, expect, it } from 'vitest';
import { applyAcceptedHunks, buildReviewHunks, threeWayMerge } from './codeReview';

describe('code review and merge authority helpers', () => {
  it('builds stable hunks and applies only accepted hunks', async () => {
    const hunks = await buildReviewHunks('app.ts', 'a\nb\nc', 'a\nB\nc\nd');
    expect(hunks.length).toBe(2);
    expect(applyAcceptedHunks('a\nb\nc', hunks, new Set([hunks[0].id]))).not.toBe('a\nB\nc\nd');
    expect(applyAcceptedHunks('a\nb\nc', hunks, new Set(hunks.map(row => row.id)))).toBe('a\nB\nc\nd');
  });

  it('performs clean and conflicting three-way merges against a real base', () => {
    expect(threeWayMerge('a\nkeep\nb', 'A\nkeep\nb', 'a\nkeep\nB')).toEqual({ content: 'A\nkeep\nB', conflict: false });
    const conflict = threeWayMerge('a', 'local', 'remote');
    expect(conflict.conflict).toBe(true);
    expect(conflict.content).toContain('COMMON BASE');
  });
});

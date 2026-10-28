import { describe, expect, it } from 'vitest';
import { conversationPath, conversationState } from './MessagesInboxPage';

describe('Explorer messages inbox', () => {
  it('links conversation summaries to the existing user thread route', () => {
    expect(conversationPath({ participantId: 'user/name' })).toBe('/feed/messages/user%2Fname');
    expect(conversationPath({ participantId: undefined })).toBeNull();
  });

  it('explains direct-message and request states', () => {
    expect(conversationState({ requestStatus: 'active', unread: true }, 'me')).toBe('Unread');
    expect(conversationState({ requestStatus: 'pending', initiatedBy: 'me', unread: false }, 'me')).toBe('Request pending');
    expect(conversationState({ requestStatus: 'pending', initiatedBy: 'other', unread: false }, 'me')).toBe('Message request');
    expect(conversationState({ requestStatus: 'declined', unread: false }, 'me')).toBe('Request declined');
  });
});

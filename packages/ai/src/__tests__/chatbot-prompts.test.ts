import { describe, it, expect } from 'vitest';

import {
  buildChatbotSystemPrompt,
  parseSuggestedActions,
  sanitizeMessageHistory,
} from '../prompts/chatbot';
import type { ChatbotPromptConfig } from '../prompts/chatbot';

describe('Chatbot Prompts', () => {
  const baseConfig: ChatbotPromptConfig = {
    siteName: 'Cabinet Test',
    practitionerName: 'Dr. Test',
    practitionerTitle: 'Psychologue',
    specialties: ['Thérapie individuelle', 'Gestion du stress'],
  };

  describe('buildChatbotSystemPrompt', () => {
    it('should include site name and practitioner info', () => {
      const prompt = buildChatbotSystemPrompt(baseConfig);

      expect(prompt).toContain('Cabinet Test');
      expect(prompt).toContain('Dr. Test');
      expect(prompt).toContain('Psychologue');
    });

    it('should include specialties', () => {
      const prompt = buildChatbotSystemPrompt(baseConfig);

      expect(prompt).toContain('Thérapie individuelle');
      expect(prompt).toContain('Gestion du stress');
    });

    it('should include location when provided', () => {
      const prompt = buildChatbotSystemPrompt({
        ...baseConfig,
        location: 'Paris 8e',
      });

      expect(prompt).toContain('Paris 8e');
    });

    it('should include contact info when provided', () => {
      const prompt = buildChatbotSystemPrompt({
        ...baseConfig,
        contact: { phone: '01 23 45 67 89', email: 'contact@test.fr' },
      });

      expect(prompt).toContain('01 23 45 67 89');
      expect(prompt).toContain('contact@test.fr');
    });

    it('should include response rules', () => {
      const prompt = buildChatbotSystemPrompt(baseConfig);

      expect(prompt).toContain('[ACTION:appointment]');
      expect(prompt).toContain('français');
      expect(prompt).toContain('empathique');
    });

    it('should include additional context', () => {
      const prompt = buildChatbotSystemPrompt({
        ...baseConfig,
        additionalContext: 'Spécialiste en EMDR',
      });

      expect(prompt).toContain('Spécialiste en EMDR');
    });
  });

  describe('parseSuggestedActions', () => {
    it('should extract appointment action', () => {
      const { cleanResponse, actions } = parseSuggestedActions(
        'Voici notre réponse. [ACTION:appointment]'
      );

      expect(cleanResponse).toBe('Voici notre réponse.');
      expect(actions).toHaveLength(1);
      expect(actions.at(0)).toMatchObject({ type: 'appointment', label: 'Prendre rendez-vous' });
    });

    it('should extract multiple actions', () => {
      const { actions } = parseSuggestedActions('Test [ACTION:appointment] et [ACTION:contact]');

      expect(actions).toHaveLength(2);
      expect(actions.at(0)).toMatchObject({ type: 'appointment' });
      expect(actions.at(1)).toMatchObject({ type: 'contact' });
    });

    it('should deduplicate actions', () => {
      const { actions } = parseSuggestedActions('[ACTION:appointment] text [ACTION:appointment]');

      expect(actions).toHaveLength(1);
    });

    it('should handle no actions', () => {
      const { cleanResponse, actions } = parseSuggestedActions('Just a normal response');

      expect(cleanResponse).toBe('Just a normal response');
      expect(actions).toHaveLength(0);
    });
  });

  describe('sanitizeMessageHistory', () => {
    it('should filter to user/assistant only', () => {
      const messages = [
        { role: 'system', content: 'system msg' },
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'hi' },
      ];

      const result = sanitizeMessageHistory(messages);
      expect(result).toHaveLength(2);
      expect(result).toEqual([
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'hi' },
      ]);
    });

    it('should enforce alternating roles', () => {
      const messages = [
        { role: 'user', content: 'msg1' },
        { role: 'user', content: 'msg2' },
        { role: 'assistant', content: 'reply' },
      ];

      const result = sanitizeMessageHistory(messages);
      expect(result).toHaveLength(2);
      expect(result).toEqual([
        { role: 'user', content: 'msg1' },
        { role: 'assistant', content: 'reply' },
      ]);
    });

    it('should ensure first message is from user', () => {
      const messages = [
        { role: 'assistant', content: 'hi' },
        { role: 'user', content: 'hello' },
      ];

      const result = sanitizeMessageHistory(messages);
      expect(result).toHaveLength(1);
      expect(result).toEqual([{ role: 'user', content: 'hello' }]);
    });

    it('should handle empty array', () => {
      expect(sanitizeMessageHistory([])).toHaveLength(0);
    });
  });
});

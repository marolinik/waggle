import { describe, it, expect } from 'vitest';
import { evaluateScenario, type MockAgentResponse } from './framework.js';
import { SCENARIOS } from './scenarios.js';

describe('Evaluation Framework', () => {
  it('passes a scenario with correct response', () => {
    const scenario = SCENARIOS.find(s => s.name === 'concise-simple')!;
    const response: MockAgentResponse = { content: 'The answer is 4.', toolsUsed: [] };
    const result = evaluateScenario(scenario, response);
    expect(result.passed).toBe(true);
  });

  it('fails a scenario with missing content', () => {
    const scenario = SCENARIOS.find(s => s.name === 'identity-who')!;
    const response: MockAgentResponse = { content: 'I am a helpful assistant.', toolsUsed: [] };
    const result = evaluateScenario(scenario, response);
    expect(result.passed).toBe(false);
    expect(result.failures.some(f => f.includes('waggle'))).toBe(true);
  });

  it('fails a scenario with wrong tools', () => {
    const scenario = SCENARIOS.find(s => s.name === 'tool-read-file')!;
    const response: MockAgentResponse = { content: 'Here is the file', toolsUsed: ['bash'] };
    const result = evaluateScenario(scenario, response);
    expect(result.passed).toBe(false);
  });

  it('fails a scenario exceeding maxLength', () => {
    const scenario = SCENARIOS.find(s => s.name === 'concise-simple')!;
    const response: MockAgentResponse = { content: '4 ' + 'x'.repeat(300), toolsUsed: [] };
    const result = evaluateScenario(scenario, response);
    expect(result.passed).toBe(false);
  });

  it('has at least 10 scenarios', () => {
    expect(SCENARIOS.length).toBeGreaterThanOrEqual(10);
  });
});

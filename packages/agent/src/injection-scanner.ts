export interface ScanResult {
  safe: boolean;
  score: number;
  flags: string[];
}

const ROLE_OVERRIDE_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+(instructions|prompts|rules)/i,
  /you\s+are\s+now\s+/i,
  /new\s+instructions?\s*:/i,
  /forget\s+(everything|all|your)\s+(you|instructions|rules)/i,
  /override\s+(your|the|all)\s+(instructions|rules|prompt)/i,
  /disregard\s+(your|the|all|previous)\s+(instructions|rules|prompt)/i,
  /ignoriere\s+alle/i,
  /ignora\s+todas/i,
  /ignorez\s+toutes/i,
];

const PROMPT_EXTRACTION_PATTERNS = [
  /print\s+(your|the)\s+system\s+prompt/i,
  /show\s+(me\s+)?(your|the)\s+(system\s+)?prompt/i,
  /what\s+(is|are)\s+your\s+(system\s+)?(prompt|instructions|rules)/i,
  /repeat\s+(your|the)\s+(system\s+)?(prompt|instructions)/i,
  /output\s+(your|the)\s+(system\s+)?prompt\s+verbatim/i,
];

const INSTRUCTION_INJECTION_PATTERNS = [
  /IMPORTANT\s*:\s*(ignore|disregard|forget|override)/i,
  /SYSTEM\s*:\s*/i,
  /\[INST\]/i,
  /<<SYS>>/i,
  /\bASSISTANT\s*:\s*/i,
  /BEGIN\s+NEW\s+INSTRUCTIONS/i,
];

export function scanForInjection(
  text: string,
  context: 'user_input' | 'tool_output' = 'user_input'
): ScanResult {
  const flags: string[] = [];
  let score = 0;

  for (const pattern of ROLE_OVERRIDE_PATTERNS) {
    if (pattern.test(text)) { flags.push('role_override'); score += 0.5; break; }
  }

  for (const pattern of PROMPT_EXTRACTION_PATTERNS) {
    if (pattern.test(text)) { flags.push('prompt_extraction'); score += 0.4; break; }
  }

  for (const pattern of INSTRUCTION_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      flags.push('instruction_injection');
      score += context === 'tool_output' ? 0.6 : 0.3;
      break;
    }
  }

  score = Math.min(score, 1.0);

  return { safe: score < 0.3, score, flags };
}

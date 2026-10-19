/**
 * Input & output safety guard for the Golden Compass Education Assistant.
 * Strictly enforces that:
 * 1. Prompts requesting buy/sell/hold, stock picking, sizing, personal financial advice are refused.
 * 2. Unrelated/adversarial prompts (jailbreaks, coding, general knowledge, political, medical) are refused.
 * 3. Output check verifies that responses never contain recommendations (e.g. "you should buy", "strong buy").
 */

export const ASSISTANT_REFUSAL_MESSAGE =
  "I can only help with your Golden Compass portfolio and investing concepts. I cannot recommend specific stocks, give buy/sell advice, or size positions.";

export const ADVERSARIAL_KEYWORDS = [
  "ignore previous instructions",
  "ignore all previous",
  "system prompt",
  "reveal your prompt",
  "write python",
  "write code",
  "write a poem",
  "who is the president",
  "medical advice",
  "legal advice",
  "bypass safety",
  "jailbreak",
  "act as dan",
  "unrestricted mode",
  "predict the election",
  "tell me a joke",
  "write an essay",
  "translate this to french",
  "crypto pump",
  "hack into",
];

export const ADVICE_REQUEST_PATTERNS = [
  /\bshould i buy\b/i,
  /\bshould i sell\b/i,
  /\bshould i hold\b/i,
  /\bwhich stock should i buy\b/i,
  /\bwhat should i invest in\b/i,
  /\bpick a stock\b/i,
  /\bhow much (should|do) i invest in\b/i,
  /\bbest stock to buy today\b/i,
  /\bguaranteed return\b/i,
  /\bis .* a buy or sell\b/i,
  /\btarget price for\b/i,
  /\bwhere should i put my money\b/i,
];

export const ADVICE_OUTPUT_PATTERNS = [
  /\byou should buy\b/i,
  /\byou should sell\b/i,
  /\bi recommend buying\b/i,
  /\bi recommend selling\b/i,
  /\bstrong buy\b/i,
  /\bstrong sell\b/i,
  /\bdefinitely invest in\b/i,
  /\ballocate \d+% of your portfolio to\b/i,
];

export interface GuardResult {
  allowed: boolean;
  refusalReason?: string;
  response?: string;
}

/**
 * Validates user input before sending to LLM.
 */
export function evaluateUserPrompt(prompt: string): GuardResult {
  const p = prompt.trim().toLowerCase();
  if (!p) {
    return { allowed: false, refusalReason: "empty_prompt", response: ASSISTANT_REFUSAL_MESSAGE };
  }

  // 1. Check adversarial keywords
  for (const kw of ADVERSARIAL_KEYWORDS) {
    if (p.includes(kw)) {
      return {
        allowed: false,
        refusalReason: "adversarial_prompt",
        response: ASSISTANT_REFUSAL_MESSAGE,
      };
    }
  }

  // 2. Check financial advice requests
  for (const pattern of ADVICE_REQUEST_PATTERNS) {
    if (pattern.test(p)) {
      return {
        allowed: false,
        refusalReason: "advice_request",
        response: ASSISTANT_REFUSAL_MESSAGE,
      };
    }
  }

  return { allowed: true };
}

/**
 * Validates LLM output to ensure it contains no recommendation or sizing.
 */
export function validateAssistantOutput(output: string): GuardResult {
  for (const pattern of ADVICE_OUTPUT_PATTERNS) {
    if (pattern.test(output)) {
      return {
        allowed: false,
        refusalReason: "output_contains_advice",
        response: ASSISTANT_REFUSAL_MESSAGE,
      };
    }
  }

  return { allowed: true };
}

/**
 * Robust JSON and XML parsing utilities for AI responses
 * @package @kairn/ai
 */

/**
 * Attempt to parse JSON from AI response, with error recovery
 *
 * Handles common issues:
 * - Markdown code blocks
 * - Truncated JSON
 * - Missing closing brackets
 * - Extra text before/after JSON
 *
 * @param text Raw text from AI response
 * @returns Parsed JSON object or null if parsing fails
 */
export function parseJsonSafe<T = unknown>(text: string): T | null {
  if (!text || typeof text !== 'string') {
    return null;
  }

  // Try direct parse first
  try {
    return JSON.parse(text) as T;
  } catch {
    // Continue with recovery attempts
  }

  // Remove markdown code blocks
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // Try parsing cleaned text
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Continue with more recovery
  }

  // Find JSON-like structure (object or array)
  const objectMatch = cleaned.match(/\{[\s\S]*\}/);
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);

  const jsonText = objectMatch?.[0] || arrayMatch?.[0];
  if (jsonText) {
    try {
      return JSON.parse(jsonText) as T;
    } catch {
      // Try to fix truncated JSON
      const fixed = fixTruncatedJson(jsonText);
      if (fixed) {
        try {
          return JSON.parse(fixed) as T;
        } catch {
          // Give up
        }
      }
    }
  }

  return null;
}

/**
 * Attempt to fix truncated JSON by adding missing closing brackets
 */
function fixTruncatedJson(json: string): string | null {
  let fixed = json.trim();

  // Count brackets
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < fixed.length; i++) {
    const char = fixed[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') braceCount++;
      else if (char === '}') braceCount--;
      else if (char === '[') bracketCount++;
      else if (char === ']') bracketCount--;
    }
  }

  // If we're in a string, try to close it
  if (inString) {
    fixed += '"';
  }

  // Remove trailing comma if present
  fixed = fixed.replace(/,\s*$/, '');

  // Add missing closing brackets
  while (bracketCount > 0) {
    fixed += ']';
    bracketCount--;
  }

  while (braceCount > 0) {
    fixed += '}';
    braceCount--;
  }

  return fixed;
}

/**
 * Extract content from XML-like tags
 *
 * @param text Text containing XML tags
 * @param tagName Name of the tag to extract
 * @returns Content between tags or null if not found
 *
 * @example
 * ```typescript
 * const title = extractXmlBlock(response, "TITLE");
 * // From: <TITLE>My Article Title</TITLE>
 * // Returns: "My Article Title"
 * ```
 */
export function extractXmlBlock(text: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = text.match(regex);
  return match && match[1] ? match[1].trim() : null;
}

/**
 * Extract multiple instances of an XML block
 *
 * @param text Text containing XML tags
 * @param tagName Name of the tag to extract
 * @returns Array of content strings
 */
export function extractAllXmlBlocks(text: string, tagName: string): string[] {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
  const matches = [...text.matchAll(regex)];
  return matches.map(match => (match[1] ?? '').trim()).filter(Boolean);
}

/**
 * Check if all required XML tags are present and complete
 *
 * @param text Text to validate
 * @param requiredTags Array of required tag names
 * @returns Object with validation result and missing tags
 */
export function validateXmlTags(
  text: string,
  requiredTags: string[]
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const tag of requiredTags) {
    if (!extractXmlBlock(text, tag)) {
      missing.push(tag);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Parse a list from AI response (handles various formats)
 *
 * Supports:
 * - JSON arrays
 * - Comma-separated values
 * - Numbered lists
 * - Bullet point lists
 * - Line-separated values
 *
 * @param text Raw text containing a list
 * @returns Array of strings
 */
export function parseList(text: string): string[] {
  if (!text) return [];

  // Try JSON array first
  try {
    const parsed: unknown = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return (parsed as unknown[]).map(String).filter(Boolean);
    }
  } catch {
    // Continue with other formats
  }

  // Remove common list wrappers
  const cleaned = text
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '')
    .trim();

  // Check if it looks like comma-separated
  if (cleaned.includes(',') && !cleaned.includes('\n')) {
    return cleaned
      .split(',')
      .map(s => s.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean);
  }

  // Handle numbered or bulleted lists
  return cleaned
    .split(/\n/)
    .map(line =>
      line
        .replace(/^\s*[-•*]\s*/, '') // Remove bullets
        .replace(/^\s*\d+[.)]\s*/, '') // Remove numbers
        .replace(/^["']|["']$/g, '') // Remove quotes
        .trim()
    )
    .filter(Boolean);
}

/**
 * Parse FAQ format from AI response
 *
 * @param text Text containing FAQ items
 * @returns Array of question/answer pairs
 */
export function parseFaq(text: string): Array<{ question: string; answer: string }> {
  // Try JSON first
  const json = parseJsonSafe<Array<{ question: string; answer: string }>>(text);
  if (json && Array.isArray(json)) {
    return json.filter(
      item => typeof item === 'object' && item !== null && 'question' in item && 'answer' in item
    );
  }

  // Try XML-like format
  const faqBlocks = extractAllXmlBlocks(text, 'FAQ_ITEM');
  if (faqBlocks.length > 0) {
    return faqBlocks
      .map(block => ({
        question: extractXmlBlock(block, 'QUESTION') || '',
        answer: extractXmlBlock(block, 'ANSWER') || '',
      }))
      .filter(item => item.question && item.answer);
  }

  // Try pattern matching (Q: ... A: ...)
  const qaPattern = /(?:Q(?:uestion)?[:.]?\s*)?(.+?)\n+(?:A(?:nswer)?[:.]?\s*)(.+?)(?=\n+Q|$)/gis;
  const matches = [...text.matchAll(qaPattern)];
  if (matches.length > 0) {
    return matches
      .map(match => ({
        question: (match[1] ?? '').trim(),
        answer: (match[2] ?? '').trim(),
      }))
      .filter(item => item.question && item.answer);
  }

  return [];
}

/**
 * Clean markdown content from AI response
 *
 * Normalizes:
 * - Line breaks within paragraphs
 * - Whitespace
 * - Code block markers
 *
 * @param text Raw markdown text
 * @returns Cleaned markdown
 */
export function cleanMarkdown(text: string): string {
  if (!text) return '';

  return (
    text
      // Remove any XML tags that might have leaked through
      .replace(/<[A-Z_]+>|<\/[A-Z_]+>/g, '')
      // Normalize line endings
      .replace(/\r\n/g, '\n')
      // Fix paragraphs with internal line breaks (but preserve intentional ones)
      .replace(/([^\n])\n([^\n#>*\-\d])/g, '$1 $2')
      // Remove excessive blank lines
      .replace(/\n{3,}/g, '\n\n')
      // Trim
      .trim()
  );
}

/**
 * Contextual skill recommendation engine.
 *
 * Matches installed skills to conversation context via keyword similarity,
 * enabling the agent to proactively suggest relevant skills.
 */

export interface SkillRecommendation {
  skillName: string;
  reason: string;
  relevanceScore: number; // 0-1
}

export interface SkillRecommenderDeps {
  /** Function to get current installed skills (name + content) */
  getSkills: () => Array<{ name: string; content: string }>;
  /** Currently active skill names (to filter out) */
  activeSkills?: string[];
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'shall', 'for', 'and', 'but', 'or',
  'nor', 'not', 'so', 'yet', 'to', 'of', 'in', 'on', 'at', 'by', 'with',
  'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
  'above', 'below', 'between', 'this', 'that', 'these', 'those', 'it',
  'its', 'my', 'your', 'our', 'their', 'what', 'which', 'who', 'whom',
  'how', 'when', 'where', 'why', 'all', 'each', 'every', 'both', 'few',
  'more', 'most', 'some', 'any', 'no', 'just', 'very', 'also', 'than', 'then',
]);

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map(w => w.replace(/[^a-z0-9-_]/g, ''))
    .filter(w => w.length >= 3 && !STOP_WORDS.has(w));
}

export class SkillRecommender {
  constructor(private deps: SkillRecommenderDeps) {}

  /**
   * Given conversation context (user's recent message or topic),
   * return top-N skill recommendations ranked by relevance.
   */
  recommend(context: string, topN: number = 3): SkillRecommendation[] {
    if (!context || !context.trim()) return [];

    const keywords = extractKeywords(context);
    if (keywords.length === 0) return [];

    const skills = this.deps.getSkills();
    const activeSet = new Set(this.deps.activeSkills ?? []);

    const scored: SkillRecommendation[] = [];

    for (const skill of skills) {
      if (activeSet.has(skill.name)) continue;

      const nameLower = skill.name.toLowerCase();
      const contentLower = skill.content.toLowerCase();

      let matchCount = 0;
      const matchedInName: string[] = [];
      const matchedInContent: string[] = [];

      for (const kw of keywords) {
        const inName = nameLower.includes(kw);
        const inContent = contentLower.includes(kw);

        if (inName) {
          matchCount += 2; // Name matches score 2x
          matchedInName.push(kw);
        } else if (inContent) {
          matchCount += 1;
          matchedInContent.push(kw);
        }
      }

      if (matchCount === 0) continue;

      const score = Math.min(matchCount / keywords.length, 1.0);
      if (score < 0.1) continue;

      let reason: string;
      if (matchedInName.length > 0) {
        reason = `Skill name matches your topic: "${matchedInName.join('", "')}"`;
      } else {
        reason = `Skill content mentions: "${matchedInContent.join('", "')}"`;
      }

      scored.push({
        skillName: skill.name,
        reason,
        relevanceScore: Math.round(score * 1000) / 1000, // 3 decimal places
      });
    }

    scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return scored.slice(0, topN);
  }
}

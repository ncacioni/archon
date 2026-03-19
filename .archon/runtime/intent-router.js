import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Intent definitions: keywords → agent activation order
 * Security (S2) is always included for BUILD, SECURE, DATA intents
 */
const INTENT_MAP = {
  BUILD: {
    keywords: ['add', 'create', 'implement', 'build', 'make', 'develop', 'code', 'write', 'feature', 'endpoint', 'route', 'component', 'page', 'module'],
    agents: ['S3', 'S2', 'S4', 'S6'],
    description: 'Build new functionality',
  },
  REVIEW: {
    keywords: ['review', 'check', 'audit', 'look at', 'evaluate', 'inspect', 'assess'],
    agents: ['S6', 'S2'],
    description: 'Review existing code',
  },
  FIX: {
    keywords: ['fix', 'bug', 'error', 'broken', 'failing', 'crash', 'issue', 'problem', 'debug', 'repair'],
    agents: ['S4', 'S6'],
    description: 'Fix a bug or issue',
  },
  SECURE: {
    keywords: ['security', 'auth', 'authentication', 'authorization', 'permissions', 'vulnerab', 'owasp', 'xss', 'injection', 'csrf', 'secrets', 'encrypt', 'token', 'jwt', 'password', 'hash'],
    agents: ['S2', 'S1'],
    description: 'Security-related work',
  },
  TEST: {
    keywords: ['test', 'coverage', 'e2e', 'unit test', 'integration test', 'spec', 'assertion', 'mock', 'tdd'],
    agents: ['S6'],
    description: 'Testing work',
  },
  DEPLOY: {
    keywords: ['deploy', 'release', 'ci/cd', 'cicd', 'docker', 'pipeline', 'github actions', 'container', 'kubernetes', 'k8s', 'staging', 'production'],
    agents: ['S7'],
    description: 'Deployment and operations',
  },
  DESIGN: {
    keywords: ['architecture', 'design', 'spec', 'schema', 'api', 'contract', 'diagram', 'c4', 'adr', 'pattern', 'structure', 'refactor', 'restructure'],
    agents: ['S1', 'S3'],
    description: 'Architecture and design',
  },
  DATA: {
    keywords: ['migration', 'pipeline', 'etl', 'elt', 'database', 'dbt', 'airflow', 'snowflake', 'warehouse', 'table', 'index', 'query', 'sql', 'model', 'entity'],
    agents: ['S8', 'S2'],
    description: 'Data engineering work',
  },
  DOCUMENT: {
    keywords: ['document', 'readme', 'docs', 'runbook', 'changelog', 'guide', 'explain', 'describe', 'adr'],
    agents: ['S7'],
    description: 'Documentation work',
  },
  FRONTEND: {
    keywords: ['frontend', 'ui', 'ux', 'component', 'react', 'vue', 'css', 'style', 'responsive', 'accessibility', 'a11y', 'layout', 'page'],
    agents: ['S5', 'S6'],
    description: 'Frontend development',
  },
};

/**
 * Agent metadata for display and routing
 */
const SOLO_AGENTS = {
  S0: { name: 'Archon', role: 'Orchestrator', file: 'S0-archon.md' },
  S1: { name: 'Architect', role: 'Solution Design', file: 'S1-architect.md' },
  S2: { name: 'Security', role: 'Security Review', file: 'S2-security.md' },
  S3: { name: 'Spec Writer', role: 'Specifications', file: 'S3-spec-writer.md' },
  S4: { name: 'Builder', role: 'Backend Implementation', file: 'S4-builder.md' },
  S5: { name: 'Frontend', role: 'Frontend Development', file: 'S5-frontend.md' },
  S6: { name: 'QA', role: 'Quality Assurance', file: 'S6-qa.md' },
  S7: { name: 'DevOps', role: 'Operations & Docs', file: 'S7-devops.md' },
  S8: { name: 'Data', role: 'Data Engineering', file: 'S8-data.md' },
};

/**
 * Detect intent from a user message
 * Returns array of matched intents with confidence scores
 */
export function detectIntent(message) {
  const messageLower = message.toLowerCase();
  const results = [];

  for (const [intent, config] of Object.entries(INTENT_MAP)) {
    let matchCount = 0;
    const matchedKeywords = [];

    for (const keyword of config.keywords) {
      // Use word-boundary matching to avoid false positives
      // e.g., "add" should not match "address" or "padding"
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(messageLower)) {
        matchCount++;
        matchedKeywords.push(keyword);
      }
    }

    if (matchCount > 0) {
      results.push({
        intent,
        description: config.description,
        agents: config.agents,
        confidence: Math.min(matchCount / 3, 1.0), // normalize: 3+ keywords = 100%
        matchedKeywords,
      });
    }
  }

  // Sort by confidence descending
  results.sort((a, b) => b.confidence - a.confidence);

  return results;
}

/**
 * Get the ordered list of agents to activate for detected intents
 * Deduplicates and ensures security is included for implementation work
 */
export function getAgentActivationOrder(intents) {
  const agentSet = new Set();
  const ordered = [];

  for (const intent of intents) {
    for (const agent of intent.agents) {
      if (!agentSet.has(agent)) {
        agentSet.add(agent);
        ordered.push(agent);
      }
    }
  }

  // Ensure security is always present when building or modifying code
  const hasImplementation = intents.some(i =>
    ['BUILD', 'FIX', 'DATA', 'FRONTEND'].includes(i.intent)
  );
  if (hasImplementation && !agentSet.has('S2')) {
    // Insert security after first agent
    ordered.splice(1, 0, 'S2');
  }

  return ordered;
}

/**
 * Get agent metadata
 */
export function getAgentInfo(agentId) {
  return SOLO_AGENTS[agentId] || null;
}

/**
 * Get all solo agents
 */
export function listSoloAgents() {
  return { ...SOLO_AGENTS };
}

/**
 * Format detection results for display
 */
export function formatDetection(message) {
  const intents = detectIntent(message);

  if (intents.length === 0) {
    return 'No specific intent detected. Activating Archon (S0) for general assistance.';
  }

  const agents = getAgentActivationOrder(intents);
  const lines = [
    `Detected intents:`,
    ...intents.map(i =>
      `  ${i.intent} (${Math.round(i.confidence * 100)}%) — ${i.description} [${i.matchedKeywords.join(', ')}]`
    ),
    ``,
    `Agent activation order:`,
    ...agents.map(a => {
      const info = SOLO_AGENTS[a];
      return `  ${a} — ${info.name} (${info.role})`;
    }),
  ];

  return lines.join('\n');
}

// CLI interface — guarded
const _argv1ir = process.argv[1] || '';
const _metaUrlIr = fileURLToPath(import.meta.url);
if (_argv1ir.replace(/\\/g, '/') === _metaUrlIr.replace(/\\/g, '/')) {
  const [,, command, ...args] = process.argv;
  if (command === 'detect') {
    const message = args.join(' ');
    if (!message) {
      console.error('Usage: node intent-router.js detect "your message here"');
      process.exit(1);
    }
    console.log(formatDetection(message));
  } else if (command === 'agents') {
    for (const [id, info] of Object.entries(SOLO_AGENTS)) {
      console.log(`${id} — ${info.name} (${info.role}) → ${info.file}`);
    }
  } else {
    console.log('Archon Intent Router v3.0');
    console.log('Commands: detect "<message>", agents');
  }
}

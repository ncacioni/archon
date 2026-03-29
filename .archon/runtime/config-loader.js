import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(__dirname, '..', 'config.yml');

/**
 * Solo-to-team agent expansion map.
 * Defines how solo agent names resolve to team specialists.
 */
const EXPANSION_MAP = {
  builder: {
    agents: ['domain-logic', 'app-services', 'adapter-layer'],
    strategy: 'sequential',
  },
  qa: {
    agents: ['test-engineer', 'code-reviewer'],
    strategy: 'parallel',
  },
  frontend: {
    agents: ['ui-engineer'],
    strategy: 'parallel',
    conditionalAgents: [
      { name: 'ux-researcher', condition: 'size:L,XL' },
    ],
  },
  data: {
    agents: ['data-modeler', 'pipeline-engineer', 'warehouse-engineer'],
    strategy: 'sequential',
  },
  devops: {
    agents: ['ci-cd-engineer', 'observability-engineer', 'release-manager'],
    strategy: 'parallel',
  },
  architect: { agents: ['architect'], strategy: 'single' },
  security: { agents: ['security'], strategy: 'single' },
  'spec-writer': { agents: ['spec-writer'], strategy: 'single' },
  'ml-engineer': { agents: ['ml-engineer'], strategy: 'single' },
};

/**
 * Parse config.yml and return the full config object.
 * @returns {object} Parsed configuration
 */
export function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`Config file not found: ${CONFIG_PATH}`);
  }
  const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
  const config = yaml.load(raw, { schema: yaml.DEFAULT_SCHEMA });
  if (!config || typeof config !== 'object') {
    throw new Error('Invalid config: expected a YAML object');
  }
  return config;
}

/**
 * Returns the current mode: 'solo' or 'team'.
 * @returns {'solo' | 'team'}
 */
export function getMode() {
  const config = loadConfig();
  const mode = config.mode;
  if (mode !== 'solo' && mode !== 'team') {
    throw new Error(`Invalid mode "${mode}" in config. Expected "solo" or "team".`);
  }
  return mode;
}

/**
 * Returns the list of active agent names for the current mode and preset.
 * In solo mode, returns the solo agents list.
 * In team mode, returns agents from the active preset, merged with agents_override.
 * @returns {string[]}
 */
export function getActiveAgents() {
  const config = loadConfig();
  const mode = config.mode;

  if (mode === 'solo') {
    return [...(config.solo?.agents || [])];
  }

  // Team mode: resolve preset agents + override
  const presetName = config.team?.preset;
  if (!presetName) {
    throw new Error('Team mode requires a "preset" in team config.');
  }

  const presetDef = config.team?.presets?.[presetName];
  if (!presetDef) {
    throw new Error(`Unknown preset "${presetName}". Available: ${Object.keys(config.team?.presets || {}).join(', ')}`);
  }

  const presetAgents = [...(presetDef.agents || [])];
  const overrides = config.team?.agents_override || [];

  // Merge: override agents are added if not already present
  for (const agent of overrides) {
    if (!presetAgents.includes(agent)) {
      presetAgents.push(agent);
    }
  }

  return presetAgents;
}

/**
 * Evaluate whether a conditional agent should be included.
 * Condition format: "size:L,XL"
 * @param {string} condition
 * @param {object} options
 * @returns {boolean}
 */
function evaluateCondition(condition, options) {
  if (!condition) return true;

  const match = condition.match(/^size:(.+)$/);
  if (match) {
    const allowedSizes = match[1].split(',').map(s => s.trim().toUpperCase());
    const currentSize = (options.size || '').toUpperCase();
    return allowedSizes.includes(currentSize);
  }

  return false;
}

/**
 * Resolve a solo agent name to the concrete agents to spawn.
 *
 * @param {string} soloName - The solo agent name (e.g. 'builder', 'qa')
 * @param {object} [options={}] - Resolution options
 * @param {string} [options.size] - Task size: S, M, L, XL
 * @returns {{ mode: string, agents: string[], strategy: string, agents_dir: string, unavailable: string[] }}
 */
export function resolve(soloName, options = {}) {
  const config = loadConfig();
  const mode = config.mode;

  // Solo mode: return the solo agent directly
  if (mode === 'solo') {
    // Validate soloName exists in solo agents
    const soloAgents = config.solo?.agents || [];
    if (!soloAgents.includes(soloName)) {
      throw new Error(`Unknown agent "${soloName}". Available solo agents: ${soloAgents.join(', ')}`);
    }
    return {
      mode: 'solo',
      agents: [soloName],
      strategy: 'single',
      agents_dir: config.solo?.agents_dir || '.claude/agents/solo',
      unavailable: [],
    };
  }

  // Team mode: expand via EXPANSION_MAP (use hasOwn to prevent prototype pollution)
  if (!Object.hasOwn(EXPANSION_MAP, soloName)) {
    throw new Error(`Unknown agent "${soloName}". Available expansions: ${Object.keys(EXPANSION_MAP).join(', ')}`);
  }
  const expansion = EXPANSION_MAP[soloName];

  // Start with base agents from expansion
  const candidates = [...expansion.agents];

  // Evaluate conditional agents
  if (expansion.conditionalAgents) {
    for (const conditional of expansion.conditionalAgents) {
      if (evaluateCondition(conditional.condition, options)) {
        candidates.push(conditional.name);
      }
    }
  }

  // Filter against active preset agents
  const activeAgents = getActiveAgents();
  const agents = [];
  const unavailable = [];

  for (const agent of candidates) {
    if (activeAgents.includes(agent)) {
      agents.push(agent);
    } else {
      unavailable.push(agent);
    }
  }

  return {
    mode: 'team',
    agents,
    strategy: expansion.strategy,
    agents_dir: config.team?.agents_dir || '.claude/agents/team',
    unavailable,
  };
}

// CLI interface — guarded
const _argv1cl = process.argv[1] || '';
const _metaUrlCl = fileURLToPath(import.meta.url);
if (_argv1cl.replace(/\\/g, '/') === _metaUrlCl.replace(/\\/g, '/')) {
  const [,, command, ...args] = process.argv;

  if (command === 'mode') {
    process.stdout.write(getMode());
  } else if (command === 'agents') {
    console.log(JSON.stringify(getActiveAgents()));
  } else if (command === 'resolve') {
    const name = args[0];
    if (!name) {
      console.error('Usage: node config-loader.js resolve <agent-name> [--size S|M|L|XL]');
      process.exit(1);
    }
    const options = {};
    const sizeIdx = args.indexOf('--size');
    if (sizeIdx !== -1 && args[sizeIdx + 1]) {
      options.size = args[sizeIdx + 1];
    }
    console.log(JSON.stringify(resolve(name, options), null, 2));
  } else {
    console.log('Archon Config Loader');
    console.log('Commands: mode, agents, resolve <name> [--size S|M|L|XL]');
  }
}

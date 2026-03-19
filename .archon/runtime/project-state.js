import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Project state tracker for Archon.
 * Tracks which phases/reviews have been completed per feature.
 * State is gitignored — ephemeral per-machine.
 */

const STATE_FILE = path.join(__dirname, '..', '..', '.archon', 'state.json');

const EMPTY_STATE = {
  version: '3.0',
  features: {},
};

/**
 * Load project state from disk.
 * Returns empty state if file doesn't exist.
 */
export function loadState() {
  if (!fs.existsSync(STATE_FILE)) return structuredClone(EMPTY_STATE);
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return structuredClone(EMPTY_STATE);
  }
}

/**
 * Save project state to disk.
 */
function saveState(state) {
  const dir = path.dirname(STATE_FILE);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

/**
 * Get or create a feature tracker.
 * @param {string} featureId - short slug, e.g. "user-auth"
 */
const VALID_PHASES = new Set(['spec', 'security_review', 'implementation', 'tests', 'review']);

function createFeature(id) {
  return {
    id,
    created: new Date().toISOString(),
    spec: false,
    security_review: false,
    implementation: false,
    tests: false,
    review: false,
  };
}

export function getFeature(featureId) {
  const state = loadState();
  return state.features[featureId] || createFeature(featureId);
}

/**
 * Mark a phase as complete for a feature.
 * @param {string} featureId
 * @param {string} phase - one of: spec, security_review, implementation, tests, review
 * @param {string} [artifact] - optional artifact path or description
 */
export function markComplete(featureId, phase, artifact) {
  if (!VALID_PHASES.has(phase)) {
    throw new Error(`Invalid phase "${phase}". Valid phases: ${[...VALID_PHASES].join(', ')}`);
  }
  const state = loadState();
  if (!state.features[featureId]) {
    state.features[featureId] = createFeature(featureId);
  }
  state.features[featureId][phase] = artifact || true;
  state.features[featureId].updated = new Date().toISOString();
  saveState(state);
  return state.features[featureId];
}

/**
 * Get pending reviews/phases across all features.
 * Returns features that have implementation but missing security review or tests.
 */
export function getPendingReviews() {
  const state = loadState();
  const pending = [];

  for (const [id, feature] of Object.entries(state.features)) {
    const issues = [];
    if (feature.implementation && !feature.security_review) {
      issues.push('security_review');
    }
    if (feature.implementation && !feature.tests) {
      issues.push('tests');
    }
    if (feature.spec && !feature.implementation) {
      issues.push('implementation');
    }
    if (issues.length > 0) {
      pending.push({ id, missing: issues, feature });
    }
  }

  return pending;
}

/**
 * Clear completed features (all phases done).
 */
export function clearCompleted() {
  const state = loadState();
  let cleared = 0;
  for (const [id, feature] of Object.entries(state.features)) {
    if (feature.spec && feature.security_review && feature.implementation && feature.tests && feature.review) {
      delete state.features[id];
      cleared++;
    }
  }
  if (cleared > 0) saveState(state);
  return { cleared };
}

/**
 * List all tracked features with their status.
 */
export function listFeatures() {
  const state = loadState();
  return Object.values(state.features);
}

// CLI interface — guarded
const _argv1ps = process.argv[1] || '';
const _metaUrlPs = fileURLToPath(import.meta.url);
if (_argv1ps.replace(/\\/g, '/') === _metaUrlPs.replace(/\\/g, '/')) {
  const [,, command, ...args] = process.argv;
  if (command === 'status') {
    const features = listFeatures();
    if (features.length === 0) {
      console.log('No features tracked.');
    } else {
      for (const f of features) {
        const phases = ['spec', 'security_review', 'implementation', 'tests', 'review'];
        const status = phases.map(p => f[p] ? '\u2713' : '\u2717').join(' ');
        console.log(`${f.id}: [${status}] (spec sec impl test review)`);
      }
    }
  } else if (command === 'pending') {
    const pending = getPendingReviews();
    if (pending.length === 0) {
      console.log('No pending reviews.');
    } else {
      for (const p of pending) {
        console.log(`${p.id}: missing ${p.missing.join(', ')}`);
      }
    }
  } else if (command === 'mark') {
    const [featureId, phase, ...rest] = args;
    if (!featureId || !phase) {
      console.error('Usage: node project-state.js mark <feature-id> <phase> [artifact]');
      process.exit(1);
    }
    const result = markComplete(featureId, phase, rest.join(' ') || undefined);
    console.log(JSON.stringify(result, null, 2));
  } else if (command === 'clear') {
    const result = clearCompleted();
    console.log(`Cleared ${result.cleared} completed features.`);
  } else {
    console.log('Archon Project State v3.0');
    console.log('Commands: status, pending, mark <id> <phase> [artifact], clear');
  }
}

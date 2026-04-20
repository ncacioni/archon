#!/usr/bin/env node
/**
 * Session Lock — pipeline checkpoint and crash recovery for Archon commands.
 * Writes phase checkpoints so interrupted pipelines can resume from the last completed phase.
 *
 * Usage:
 *   node session-lock.js check                     — show active session status
 *   node session-lock.js clear                     — remove active session lock
 *   node session-lock.js write <command> <phase>   — checkpoint current phase
 *   node session-lock.js complete <command> <phase>— mark phase as complete
 *
 * Session file: .archon/session.json (gitignored)
 * Stale threshold: 2 hours (configurable via ARCHON_SESSION_TTL_HOURS env)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SESSION_PATH = path.join(__dirname, '..', 'session.json');
const STALE_HOURS = Number(process.env.ARCHON_SESSION_TTL_HOURS ?? 2);

export function readSession() {
  if (!fs.existsSync(SESSION_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(SESSION_PATH, 'utf-8'));
  } catch {
    return null;
  }
}

export function isStale(session) {
  if (!session?.timestamp) return true;
  const age = Date.now() - new Date(session.timestamp).getTime();
  return age > STALE_HOURS * 60 * 60 * 1000;
}

export function writeCheckpoint(command, phase, artifacts = []) {
  const existing = readSession() ?? {};
  const session = {
    command,
    current_phase: phase,
    started_at: existing.started_at ?? new Date().toISOString(),
    timestamp: new Date().toISOString(),
    completed_phases: existing.completed_phases ?? [],
    artifacts_written: [...new Set([...(existing.artifacts_written ?? []), ...artifacts])],
  };
  fs.writeFileSync(SESSION_PATH, JSON.stringify(session, null, 2) + '\n', 'utf-8');
  return session;
}

export function completePhase(command, phase) {
  const session = readSession();
  if (!session || session.command !== command) {
    return writeCheckpoint(command, phase);
  }
  const completed = [...new Set([...(session.completed_phases ?? []), phase])];
  const updated = { ...session, completed_phases: completed, timestamp: new Date().toISOString() };
  fs.writeFileSync(SESSION_PATH, JSON.stringify(updated, null, 2) + '\n', 'utf-8');
  return updated;
}

export function clearSession() {
  if (fs.existsSync(SESSION_PATH)) {
    fs.unlinkSync(SESSION_PATH);
    return true;
  }
  return false;
}

export function checkResume(command) {
  const session = readSession();
  if (!session) return { canResume: false, reason: 'no active session' };
  if (session.command !== command) {
    return { canResume: false, reason: `session is for command "/${session.command}", not "/${command}"` };
  }
  if (isStale(session)) {
    return { canResume: false, stale: true, session, reason: `session is stale (last activity: ${session.timestamp})` };
  }
  return {
    canResume: true,
    session,
    completedPhases: session.completed_phases ?? [],
    resumeFrom: session.current_phase,
  };
}

export function formatStatus(session) {
  if (!session) return 'No active session.';
  const stale = isStale(session);
  const age = Math.round((Date.now() - new Date(session.timestamp).getTime()) / 60000);
  const lines = [
    `Session: /${session.command}`,
    `Current phase: ${session.current_phase}`,
    `Completed: ${(session.completed_phases ?? []).join(', ') || 'none'}`,
    `Last activity: ${age}m ago${stale ? ' [STALE]' : ''}`,
    `Artifacts: ${(session.artifacts_written ?? []).length} file(s)`,
  ];
  if (stale) lines.push(`Run "node session-lock.js clear" to remove the stale lock.`);
  return lines.join('\n');
}

// ── CLI ──────────────────────────────────────────────────────────────────────

const isMain = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  const [, , sub, ...rest] = process.argv;

  switch (sub) {
    case 'check': {
      const session = readSession();
      if (!session) {
        console.log('No active session.');
      } else {
        console.log(formatStatus(session));
        if (isStale(session)) process.exit(2);
      }
      break;
    }
    case 'clear': {
      const removed = clearSession();
      console.log(removed ? 'Session cleared.' : 'No session to clear.');
      break;
    }
    case 'write': {
      const [command, phase, ...artifactArgs] = rest;
      if (!command || !phase) {
        console.error('Usage: session-lock.js write <command> <phase> [artifact...]');
        process.exit(1);
      }
      const s = writeCheckpoint(command, phase, artifactArgs);
      console.log(`Checkpoint: /${s.command} → ${s.current_phase}`);
      break;
    }
    case 'complete': {
      const [command, phase] = rest;
      if (!command || !phase) {
        console.error('Usage: session-lock.js complete <command> <phase>');
        process.exit(1);
      }
      completePhase(command, phase);
      console.log(`Phase complete: ${phase}`);
      break;
    }
    default:
      console.log('Usage:');
      console.log('  node session-lock.js check');
      console.log('  node session-lock.js clear');
      console.log('  node session-lock.js write <command> <phase> [artifacts...]');
      console.log('  node session-lock.js complete <command> <phase>');
  }
}

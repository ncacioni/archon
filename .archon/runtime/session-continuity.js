import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __moduleDir = path.dirname(fileURLToPath(import.meta.url));
const SESSION_PATH = path.resolve(__moduleDir, '..', '..', 'SESSION.md');

function now() {
  return new Date().toISOString().replace('T', ' ').slice(0, 16);
}

function readSession() {
  if (!fs.existsSync(SESSION_PATH)) return null;
  return fs.readFileSync(SESSION_PATH, 'utf-8');
}

function parseSession(content) {
  if (!content) return null;
  const commandMatch = content.match(/^# Active Session — \/(\S+) (.+)$/m);
  const statusMatch = content.match(/^\*\*Status:\*\* (.+)$/m);
  const startedMatch = content.match(/^\*\*Started:\*\* (.+)$/m);

  const completed = [];
  for (const line of content.split('\n')) {
    const m = line.match(/^- ✓ (.+)$/);
    if (m) completed.push(m[1]);
  }

  const inProgressMatch = content.match(/^## In Progress\n([\s\S]*?)(?=\n##|$)/m);
  const decisionsSection = content.match(/^## Key Decisions\n([\s\S]*?)(?=\n##|$)/m);

  const decisions = [];
  if (decisionsSection) {
    for (const line of decisionsSection[1].split('\n')) {
      const m = line.match(/^- (.+)$/);
      if (m) decisions.push(m[1]);
    }
  }

  return {
    command: commandMatch ? commandMatch[1] : null,
    description: commandMatch ? commandMatch[2] : null,
    status: statusMatch ? statusMatch[1] : null,
    started: startedMatch ? startedMatch[1] : null,
    completed,
    inProgress: inProgressMatch ? inProgressMatch[1].trim() : null,
    decisions,
  };
}

function buildSessionContent(session) {
  const completedLines = session.completed.length > 0
    ? session.completed.map(p => `- ✓ ${p}`).join('\n')
    : '_None yet_';

  const decisionLines = session.decisions.length > 0
    ? session.decisions.map(d => `- ${d}`).join('\n')
    : '_None recorded_';

  const nextLines = session.nextSteps && session.nextSteps.length > 0
    ? session.nextSteps.map(s => `- ${s}`).join('\n')
    : '_TBD_';

  return [
    `# Active Session — /${session.command} ${session.description}`,
    '',
    `**Started:** ${session.started}  `,
    `**Status:** ${session.status}`,
    '',
    '## Context',
    session.context || `Running /${session.command}: ${session.description}`,
    '',
    '## Completed Phases',
    completedLines,
    '',
    '## Key Decisions',
    decisionLines,
    '',
    '## In Progress',
    session.inProgress || '_Nothing yet_',
    '',
    '## Next Steps',
    nextLines,
    '',
  ].join('\n');
}

function readOrCreate(command, description) {
  const raw = readSession();
  if (raw) {
    const parsed = parseSession(raw);
    if (parsed && parsed.command === command) return parsed;
  }
  return {
    command,
    description,
    started: now(),
    status: 'In progress',
    context: `Running /${command}: ${description}`,
    completed: [],
    decisions: [],
    inProgress: null,
    nextSteps: [],
  };
}

export function startSession(command, description) {
  const session = {
    command,
    description,
    started: now(),
    status: 'In progress',
    context: `Running /${command}: ${description}`,
    completed: [],
    decisions: [],
    inProgress: null,
    nextSteps: [],
  };
  fs.writeFileSync(SESSION_PATH, buildSessionContent(session), 'utf-8');
  return session;
}

export function updatePhase(command, phase, summary) {
  const raw = readSession();
  const session = raw ? parseSession(raw) : null;
  if (!session || session.command !== command) {
    throw new Error(`No active session for /${command}`);
  }

  // Move current inProgress to completed
  if (session.inProgress && session.inProgress !== '_Nothing yet_') {
    // Don't double-add if already in completed list
    const alreadyAdded = session.completed.some(c => c.includes(session.inProgress));
    if (!alreadyAdded) {
      session.completed.push(session.inProgress);
    }
  }

  session.inProgress = `${phase}: ${summary}`;
  session.status = `In progress — ${phase}`;

  fs.writeFileSync(SESSION_PATH, buildSessionContent(session), 'utf-8');
  return session;
}

export function completePhase(command, phase, summary) {
  const raw = readSession();
  const session = raw ? parseSession(raw) : null;
  if (!session || session.command !== command) {
    throw new Error(`No active session for /${command}`);
  }

  const entry = `${phase}: ${summary}`;
  if (!session.completed.includes(entry)) {
    session.completed.push(entry);
  }
  session.inProgress = null;

  fs.writeFileSync(SESSION_PATH, buildSessionContent(session), 'utf-8');
  return session;
}

export function addDecision(command, what, why) {
  const raw = readSession();
  const session = raw ? parseSession(raw) : null;
  if (!session || session.command !== command) {
    throw new Error(`No active session for /${command}`);
  }

  session.decisions.push(`${what} — ${why}`);
  fs.writeFileSync(SESSION_PATH, buildSessionContent(session), 'utf-8');
  return session;
}

export function completeSession(clear = false) {
  if (!fs.existsSync(SESSION_PATH)) return false;
  if (clear) {
    fs.unlinkSync(SESSION_PATH);
    return true;
  }
  const raw = readSession();
  const session = raw ? parseSession(raw) : null;
  if (session) {
    session.status = 'Completed';
    session.inProgress = null;
    fs.writeFileSync(SESSION_PATH, buildSessionContent(session), 'utf-8');
  }
  return true;
}

export function getSessionBrief() {
  const raw = readSession();
  if (!raw) return null;
  const session = parseSession(raw);
  if (!session) return null;

  const lines = [
    `[Session] /${session.command} — ${session.status}`,
  ];
  if (session.completed.length > 0) {
    lines.push(`  Completed: ${session.completed.length} phase(s)`);
  }
  if (session.inProgress) {
    lines.push(`  In progress: ${session.inProgress}`);
  }
  return lines.join('\n');
}

// CLI
const [,, subcmd, ...args] = process.argv;

if (subcmd) {
  if (subcmd === 'start') {
    const [command, description] = args;
    if (!command || !description) {
      console.error('Usage: session-continuity.js start <command> "<description>"');
      process.exit(1);
    }
    startSession(command, description);
    console.log(`Session started: /${command} — ${description}`);
  } else if (subcmd === 'update') {
    const [command, phase, ...rest] = args;
    const summary = rest.join(' ');
    if (!command || !phase || !summary) {
      console.error('Usage: session-continuity.js update <command> <phase> "<summary>"');
      process.exit(1);
    }
    try {
      updatePhase(command, phase, summary);
      console.log(`Updated: ${phase} — ${summary}`);
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
  } else if (subcmd === 'complete-phase') {
    const [command, phase, ...rest] = args;
    const summary = rest.join(' ');
    if (!command || !phase || !summary) {
      console.error('Usage: session-continuity.js complete-phase <command> <phase> "<summary>"');
      process.exit(1);
    }
    try {
      completePhase(command, phase, summary);
      console.log(`Completed phase: ${phase}`);
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
  } else if (subcmd === 'decision') {
    const [command, what, ...rest] = args;
    const why = rest.join(' ');
    if (!command || !what || !why) {
      console.error('Usage: session-continuity.js decision <command> "<what>" "<why>"');
      process.exit(1);
    }
    try {
      addDecision(command, what, why);
      console.log(`Decision recorded: ${what} — ${why}`);
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
  } else if (subcmd === 'complete') {
    const clear = args.includes('--clear');
    const result = completeSession(clear);
    console.log(result ? (clear ? 'Session cleared.' : 'Session marked complete.') : 'No active session.');
  } else if (subcmd === 'read') {
    const brief = args.includes('--brief');
    if (brief) {
      const b = getSessionBrief();
      if (b) console.log(b);
    } else {
      const raw = readSession();
      if (raw) console.log(raw);
      else console.log('No active session.');
    }
  } else {
    console.error(`Unknown subcommand: ${subcmd}`);
    process.exit(1);
  }
}

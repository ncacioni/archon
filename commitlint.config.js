export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat',     // New feature
      'fix',      // Bug fix
      'docs',     // Documentation only
      'style',    // Formatting, missing semi colons, etc
      'refactor', // Code change that neither fixes a bug nor adds a feature
      'perf',     // Performance improvement
      'test',     // Adding or updating tests
      'chore',    // Maintenance tasks
      'ci',       // CI/CD changes
      'revert',   // Reverts a previous commit
    ]],
    'subject-case': [2, 'always', 'lower-case'],
    'header-max-length': [2, 'always', 100],
  },
};

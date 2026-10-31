#!/usr/bin/env node
/**
 * watermarks-kit PostToolUse hook (check mode only).
 *
 * 1. Makes sure a pinned checkout of guillaumemeyer/watermarks-remover exists
 *    in ~/.cache/watermarks-remover (or $WATERMARKS_REPO).
 * 2. Runs its hook_written_file.py with --mode check on the file Claude just
 *    wrote. It reports marks (exit 2, shown to Claude) and never edits files.
 * Any setup failure exits 0 so a write is never disturbed.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const REPO_URL = 'https://github.com/guillaumemeyer/watermarks-remover.git';
const COMMIT = '5c180932a00c793261177f79aee21db8929f3fe2';
const REPO_DIR = process.env.WATERMARKS_REPO || path.join(os.homedir(), '.cache', 'watermarks-remover');
const SCRIPT = path.join(REPO_DIR, 'service', 'scripts', 'hook_written_file.py');
const isWin = process.platform === 'win32';

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { encoding: 'utf8', windowsHide: true, ...opts });
}

function ensureRepo() {
  const head = run('git', ['-C', REPO_DIR, 'rev-parse', 'HEAD']);
  if (head.status === 0 && head.stdout.trim() === COMMIT) return true;
  fs.rmSync(REPO_DIR, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(REPO_DIR), { recursive: true });
  if (run('git', ['clone', '--quiet', REPO_URL, REPO_DIR], { timeout: 90000 }).status !== 0) return false;
  return run('git', ['-C', REPO_DIR, 'checkout', '--quiet', COMMIT]).status === 0;
}

function findPython() {
  const candidates = isWin ? [['py', ['-3']], ['python', []], ['python3', []]] : [['python3', []], ['python', []]];
  const check = 'import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)';
  for (const [cmd, extra] of candidates) {
    if (run(cmd, [...extra, '-c', check]).status === 0) return [cmd, extra];
  }
  return null;
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => (input += chunk));
process.stdin.on('end', () => {
  try {
    const payload = JSON.parse(input || '{}');
    const ti = payload.tool_input || {};
    const target = ti.file_path || ti.notebook_path || '';
    if (!target || path.resolve(target).startsWith(path.resolve(REPO_DIR))) process.exit(0);
    if (!ensureRepo()) process.exit(0);
    const py = findPython();
    if (!py) process.exit(0);
    const [cmd, extra] = py;
    const res = run(cmd, [...extra, '-I', SCRIPT, '--mode', 'check'], { input, timeout: 25000 });
    if (res.stdout) process.stdout.write(res.stdout);
    if (res.stderr) process.stderr.write(res.stderr);
    process.exit(res.status === 2 ? 2 : 0);
  } catch {
    process.exit(0);
  }
});

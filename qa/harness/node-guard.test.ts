import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import dns from 'node:dns';
import { spawnSync } from 'node:child_process';

describe('Node harness safeguards (reviewed APIs, not an OS sandbox)', () => {
  it('writes, reads and removes owned synthetic temporary data', () => {
    const file = path.join(os.tmpdir(), 'qa-owned-probe.txt');
    try { fs.writeFileSync(file, 'fixture'); expect(fs.readFileSync(file, 'utf8')).toBe('fixture'); }
    finally { if (fs.existsSync(file)) fs.unlinkSync(file); }
    expect(fs.existsSync(file)).toBe(false);
  });
  it('denies a synthetic sensitive path before filesystem access', () => {
    expect(() => fs.readFileSync(path.join(os.tmpdir(), '.env.synthetic-probe'))).toThrow('sensitive file access denied');
  });
  it('denies writes through the dependency junction', () => {
    expect(() => fs.writeFileSync(path.resolve('node_modules/qa-denied-probe.txt'), 'fixture')).toThrow('write outside owned output denied');
  });
  it('denies unowned network sockets', () => {
    expect(() => net.connect({ host: '192.0.2.1', port: 443 })).toThrow('non-fixture connection denied');
  });
  it('denies DNS resolver instances as well as top-level lookups', () => {
    expect(() => new dns.Resolver().resolve4('qa.invalid', () => undefined)).toThrow('DNS denied');
  });
  it('denies shell execution even with an otherwise permitted executable', () => {
    expect(() => spawnSync(process.execPath, [], { shell: true })).toThrow('child shell denied');
  });
  it('denies Node eval with an allowed script smuggled later in argv', () => {
    expect(() => spawnSync(process.execPath, ['-e', 'throw new Error("must not execute")', path.resolve('qa/harness/next-server.cjs')])).toThrow('unapproved child process denied');
  });
  it('denies recursive copies before opening their source', () => {
    expect(() => fs.cpSync(process.cwd(), path.resolve('node_modules/qa-denied-probe'), { recursive: true })).toThrow('bulk copy or link creation denied');
  });
});

import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { isEmptyDir, readJson, writeJson, isDirectory } from '../../../src/utils/fs.js';

// Track temp directories for cleanup
const tempDirs: string[] = [];

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'velocity-test-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs) {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
  tempDirs.length = 0;
});

describe('isEmptyDir', () => {
  it('returns true for a non-existent path', () => {
    expect(isEmptyDir('/tmp/this-path-definitely-does-not-exist-velocity-test')).toBe(true);
  });

  it('returns true for an empty directory', () => {
    const dir = createTempDir();
    expect(isEmptyDir(dir)).toBe(true);
  });

  it('returns false for a directory with a regular file', () => {
    const dir = createTempDir();
    writeFileSync(join(dir, 'file.txt'), 'hello');
    expect(isEmptyDir(dir)).toBe(false);
  });

  it('returns true for a directory containing only .git', () => {
    const dir = createTempDir();
    mkdirSync(join(dir, '.git'));
    expect(isEmptyDir(dir)).toBe(true);
  });

  it('returns false for a directory with .git and another file', () => {
    const dir = createTempDir();
    mkdirSync(join(dir, '.git'));
    writeFileSync(join(dir, 'README.md'), '# Hello');
    expect(isEmptyDir(dir)).toBe(false);
  });

  it('returns false for a directory with a subdirectory', () => {
    const dir = createTempDir();
    mkdirSync(join(dir, 'subdir'));
    expect(isEmptyDir(dir)).toBe(false);
  });

  it('returns false for a directory with a hidden file (not .git)', () => {
    const dir = createTempDir();
    writeFileSync(join(dir, '.gitignore'), '');
    expect(isEmptyDir(dir)).toBe(false);
  });
});

describe('readJson', () => {
  it('reads and parses a JSON file', () => {
    const dir = createTempDir();
    const filePath = join(dir, 'data.json');
    writeFileSync(filePath, '{"name": "test", "version": "1.0.0"}');
    const result = readJson(filePath);
    expect(result).toEqual({ name: 'test', version: '1.0.0' });
  });

  it('reads a JSON file with a typed generic', () => {
    const dir = createTempDir();
    const filePath = join(dir, 'config.json');
    writeFileSync(filePath, '{"enabled": true, "count": 42}');
    const result = readJson<{ enabled: boolean; count: number }>(filePath);
    expect(result.enabled).toBe(true);
    expect(result.count).toBe(42);
  });

  it('reads a JSON array', () => {
    const dir = createTempDir();
    const filePath = join(dir, 'list.json');
    writeFileSync(filePath, '[1, 2, 3]');
    const result = readJson<number[]>(filePath);
    expect(result).toEqual([1, 2, 3]);
  });

  it('reads nested JSON objects', () => {
    const dir = createTempDir();
    const filePath = join(dir, 'nested.json');
    writeFileSync(filePath, '{"a": {"b": {"c": "deep"}}}');
    const result = readJson<{ a: { b: { c: string } } }>(filePath);
    expect(result.a.b.c).toBe('deep');
  });

  it('throws on invalid JSON', () => {
    const dir = createTempDir();
    const filePath = join(dir, 'bad.json');
    writeFileSync(filePath, 'not valid json {{{');
    expect(() => readJson(filePath)).toThrow();
  });

  it('throws when file does not exist', () => {
    expect(() => readJson('/tmp/nonexistent-velocity-test.json')).toThrow();
  });
});

describe('writeJson', () => {
  it('writes an object as formatted JSON with trailing newline', () => {
    const dir = createTempDir();
    const filePath = join(dir, 'output.json');
    writeJson(filePath, { name: 'test', version: '1.0.0' });

    const raw = readFileSync(filePath, 'utf-8');
    expect(raw).toBe(JSON.stringify({ name: 'test', version: '1.0.0' }, null, 2) + '\n');
  });

  it('writes with 2-space indentation', () => {
    const dir = createTempDir();
    const filePath = join(dir, 'indented.json');
    writeJson(filePath, { a: 1 });

    const raw = readFileSync(filePath, 'utf-8');
    expect(raw).toContain('  "a": 1');
  });

  it('can be read back with readJson', () => {
    const dir = createTempDir();
    const filePath = join(dir, 'roundtrip.json');
    const data = { key: 'value', nested: { arr: [1, 2, 3] } };
    writeJson(filePath, data);

    const result = readJson<typeof data>(filePath);
    expect(result).toEqual(data);
  });

  it('writes an array', () => {
    const dir = createTempDir();
    const filePath = join(dir, 'array.json');
    writeJson(filePath, [1, 'two', null]);

    const result = readJson<unknown[]>(filePath);
    expect(result).toEqual([1, 'two', null]);
  });

  it('writes null', () => {
    const dir = createTempDir();
    const filePath = join(dir, 'null.json');
    writeJson(filePath, null);

    const raw = readFileSync(filePath, 'utf-8');
    expect(raw).toBe('null\n');
  });

  it('overwrites an existing file', () => {
    const dir = createTempDir();
    const filePath = join(dir, 'overwrite.json');
    writeJson(filePath, { old: true });
    writeJson(filePath, { new: true });

    const result = readJson<{ new: boolean }>(filePath);
    expect(result).toEqual({ new: true });
  });
});

describe('isDirectory', () => {
  it('returns true for an existing directory', () => {
    const dir = createTempDir();
    expect(isDirectory(dir)).toBe(true);
  });

  it('returns false for a file', () => {
    const dir = createTempDir();
    const filePath = join(dir, 'file.txt');
    writeFileSync(filePath, 'content');
    expect(isDirectory(filePath)).toBe(false);
  });

  it('returns false for a non-existent path', () => {
    expect(isDirectory('/tmp/nonexistent-velocity-dir-test')).toBe(false);
  });

  it('returns true for a nested directory', () => {
    const dir = createTempDir();
    const nested = join(dir, 'a', 'b', 'c');
    mkdirSync(nested, { recursive: true });
    expect(isDirectory(nested)).toBe(true);
  });
});

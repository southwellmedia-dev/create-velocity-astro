import { describe, it, expect } from 'vitest';
import { validateProjectName, toValidProjectName } from '../../../src/utils/validate.js';

describe('validateProjectName', () => {
  describe('valid names', () => {
    it('accepts a simple lowercase name', () => {
      expect(validateProjectName('my-project')).toEqual({ valid: true });
    });

    it('accepts a single character name', () => {
      expect(validateProjectName('a')).toEqual({ valid: true });
    });

    it('accepts a name with numbers', () => {
      expect(validateProjectName('project123')).toEqual({ valid: true });
    });

    it('accepts a name with hyphens', () => {
      expect(validateProjectName('my-cool-project')).toEqual({ valid: true });
    });

    it('accepts a name with dots in the middle', () => {
      expect(validateProjectName('my.project')).toEqual({ valid: true });
    });

    it('accepts a name with tildes', () => {
      expect(validateProjectName('~project')).toEqual({ valid: true });
    });

    it('accepts a scoped package name', () => {
      expect(validateProjectName('@scope/my-package')).toEqual({ valid: true });
    });

    it('accepts a scoped package with numbers in scope', () => {
      expect(validateProjectName('@my-org123/package')).toEqual({ valid: true });
    });

    it('accepts a name exactly 214 characters long', () => {
      const name = 'a'.repeat(214);
      expect(validateProjectName(name)).toEqual({ valid: true });
    });

    it('accepts a name with underscores in the middle', () => {
      expect(validateProjectName('my_project')).toEqual({ valid: true });
    });
  });

  describe('empty / whitespace names', () => {
    it('rejects an empty string', () => {
      const result = validateProjectName('');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Project name cannot be empty');
    });

    it('rejects a whitespace-only string', () => {
      const result = validateProjectName('   ');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Project name cannot be empty');
    });

    it('rejects a tab-only string', () => {
      const result = validateProjectName('\t');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Project name cannot be empty');
    });
  });

  describe('uppercase rejection', () => {
    it('rejects a name with uppercase letters', () => {
      const result = validateProjectName('MyProject');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Project name must be lowercase');
    });

    it('rejects a name with a single uppercase letter', () => {
      const result = validateProjectName('myProject');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Project name must be lowercase');
    });

    it('rejects ALL CAPS', () => {
      const result = validateProjectName('MYPROJECT');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Project name must be lowercase');
    });
  });

  describe('leading character rejection', () => {
    it('rejects a name starting with a dot', () => {
      const result = validateProjectName('.hidden');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Project name cannot start with . or _');
    });

    it('rejects a name starting with an underscore', () => {
      const result = validateProjectName('_private');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Project name cannot start with . or _');
    });
  });

  describe('space rejection', () => {
    it('rejects a name with a space in the middle', () => {
      const result = validateProjectName('my project');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Project name cannot contain spaces');
    });

    it('rejects a name with a trailing space', () => {
      const result = validateProjectName('project ');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Project name cannot contain spaces');
    });

    it('rejects a name with a leading space (non-empty after trim)', () => {
      // Note: ' project' has a leading space, name !== name.toLowerCase() won't catch it,
      // but /\s/.test will catch the space
      const result = validateProjectName(' project');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Project name cannot contain spaces');
    });
  });

  describe('special character rejection', () => {
    it('rejects a name with exclamation mark', () => {
      const result = validateProjectName('project!');
      expect(result.valid).toBe(false);
      expect(result.message).toBe(
        'Project name can only contain lowercase letters, numbers, hyphens, and underscores'
      );
    });

    it('rejects a name with @ not in scoped format', () => {
      const result = validateProjectName('project@1');
      expect(result.valid).toBe(false);
      expect(result.message).toBe(
        'Project name can only contain lowercase letters, numbers, hyphens, and underscores'
      );
    });

    it('rejects a name with hash', () => {
      const result = validateProjectName('my#project');
      expect(result.valid).toBe(false);
      expect(result.message).toBe(
        'Project name can only contain lowercase letters, numbers, hyphens, and underscores'
      );
    });
  });

  describe('length rejection', () => {
    it('rejects a name longer than 214 characters', () => {
      const name = 'a'.repeat(215);
      const result = validateProjectName(name);
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Project name must be 214 characters or fewer');
    });
  });

  describe('validation order (first matching rule wins)', () => {
    it('checks empty before lowercase', () => {
      // An empty string is caught by the empty check, not lowercase
      const result = validateProjectName('');
      expect(result.message).toBe('Project name cannot be empty');
    });

    it('checks lowercase before leading character', () => {
      // '.Hidden' starts with . but also has uppercase — lowercase check comes first
      const result = validateProjectName('.Hidden');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Project name must be lowercase');
    });
  });
});

describe('toValidProjectName', () => {
  it('trims whitespace', () => {
    expect(toValidProjectName('  my-project  ')).toBe('my-project');
  });

  it('converts to lowercase', () => {
    expect(toValidProjectName('MyProject')).toBe('myproject');
  });

  it('replaces spaces with hyphens', () => {
    expect(toValidProjectName('my cool project')).toBe('my-cool-project');
  });

  it('replaces multiple spaces with a single hyphen', () => {
    expect(toValidProjectName('my   project')).toBe('my-project');
  });

  it('removes invalid characters by replacing with hyphens', () => {
    expect(toValidProjectName('my@project!')).toBe('my-project');
  });

  it('strips leading dots, hyphens, and underscores', () => {
    expect(toValidProjectName('.hidden')).toBe('hidden');
    expect(toValidProjectName('_private')).toBe('private');
    expect(toValidProjectName('-leading')).toBe('leading');
  });

  it('strips trailing dots, hyphens, and underscores', () => {
    expect(toValidProjectName('project.')).toBe('project');
    expect(toValidProjectName('project-')).toBe('project');
    expect(toValidProjectName('project_')).toBe('project');
  });

  it('strips multiple leading special characters', () => {
    expect(toValidProjectName('..._hidden')).toBe('hidden');
  });

  it('collapses consecutive hyphens', () => {
    expect(toValidProjectName('my---project')).toBe('my-project');
  });

  it('handles a complex real-world case', () => {
    expect(toValidProjectName('  My Cool Project! v2  ')).toBe('my-cool-project-v2');
  });

  it('handles an empty string', () => {
    expect(toValidProjectName('')).toBe('');
  });

  it('handles a string that becomes empty after sanitization', () => {
    expect(toValidProjectName('...')).toBe('');
  });

  it('preserves tildes', () => {
    expect(toValidProjectName('~project')).toBe('~project');
  });

  it('preserves dots in the middle', () => {
    expect(toValidProjectName('my.project')).toBe('my.project');
  });
});

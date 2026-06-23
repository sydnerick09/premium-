import {
  validateEmail, validatePassword, validateConfirmPassword,
  validateName, isRequired,
} from '../../utils/validators';

describe('validators', () => {
  describe('validateEmail', () => {
    it('returns null for valid email', () => {
      expect(validateEmail('test@example.com')).toBeNull();
    });
    it('returns error for empty email', () => {
      expect(validateEmail('')).not.toBeNull();
    });
    it('returns error for invalid email', () => {
      expect(validateEmail('notanemail')).not.toBeNull();
    });
    it('returns error for email without TLD', () => {
      expect(validateEmail('test@example')).not.toBeNull();
    });
  });

  describe('validatePassword', () => {
    it('returns null for strong password', () => {
      expect(validatePassword('Password1')).toBeNull();
    });
    it('returns error for short password', () => {
      expect(validatePassword('Pass1')).not.toBeNull();
    });
    it('returns error for no uppercase', () => {
      expect(validatePassword('password1')).not.toBeNull();
    });
    it('returns error for no number', () => {
      expect(validatePassword('Password')).not.toBeNull();
    });
  });

  describe('validateConfirmPassword', () => {
    it('returns null when passwords match', () => {
      expect(validateConfirmPassword('Password1', 'Password1')).toBeNull();
    });
    it('returns error when passwords do not match', () => {
      expect(validateConfirmPassword('Password1', 'Password2')).not.toBeNull();
    });
  });

  describe('validateName', () => {
    it('returns null for valid name', () => {
      expect(validateName('John Doe')).toBeNull();
    });
    it('returns error for short name', () => {
      expect(validateName('J')).not.toBeNull();
    });
    it('returns error for empty name', () => {
      expect(validateName('')).not.toBeNull();
    });
  });

  describe('isRequired', () => {
    it('returns null for non-empty string', () => {
      expect(isRequired('hello')).toBeNull();
    });
    it('returns error for empty string', () => {
      expect(isRequired('')).not.toBeNull();
    });
    it('returns error for whitespace only', () => {
      expect(isRequired('   ')).not.toBeNull();
    });
  });
});

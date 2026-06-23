// Stub for react-native-mmkv on web — uses localStorage
class MMKV {
  constructor(options) { this._id = options?.id ?? 'default'; }
  set(key, value) { try { localStorage.setItem(`mmkv_${this._id}_${key}`, JSON.stringify(value)); } catch {} }
  getString(key) { try { const v = localStorage.getItem(`mmkv_${this._id}_${key}`); return v ? JSON.parse(v) : undefined; } catch { return undefined; } }
  getNumber(key) { const v = this.getString(key); return typeof v === 'number' ? v : undefined; }
  getBoolean(key) { const v = this.getString(key); return typeof v === 'boolean' ? v : undefined; }
  delete(key) { try { localStorage.removeItem(`mmkv_${this._id}_${key}`); } catch {} }
  clearAll() { try { Object.keys(localStorage).filter(k => k.startsWith(`mmkv_${this._id}_`)).forEach(k => localStorage.removeItem(k)); } catch {} }
  contains(key) { return localStorage.getItem(`mmkv_${this._id}_${key}`) !== null; }
  getAllKeys() { return Object.keys(localStorage).filter(k => k.startsWith(`mmkv_${this._id}_`)).map(k => k.replace(`mmkv_${this._id}_`, '')); }
}

module.exports = { MMKV };
module.exports.default = MMKV;

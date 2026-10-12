import * as SQLite from 'expo-sqlite';

// Lab 05: embedded relational DB, offline-first. Single shared connection.
export const db = SQLite.openDatabaseSync('payer.db');

const SEED = [
  // name, detail, amount (negative = spent), kind, group, icon
  ['Meralco', 'Today, 9:12 AM', -1240.0, 'expense', 'Today', 'zap'],
  ['Maria Santos', 'Yesterday', 3000.0, 'income', 'Yesterday', 'user'],
  ['Coffee Co.', 'Oct 3', -185.0, 'expense', 'Oct 3', 'receipt'],
  ['Salary', 'Oct 1', 18500.0, 'income', 'Oct 1', 'wallet'],
  ['PLDT', 'Sep 28', -1499.0, 'expense', 'Sep 28', 'phone'],
];

export function initDatabase() {
  db.execSync('PRAGMA journal_mode = WAL;');
  db.execSync(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    detail TEXT NOT NULL,
    amount REAL NOT NULL,
    kind TEXT NOT NULL,
    tgroup TEXT NOT NULL,
    icon TEXT NOT NULL
  );`);
  db.execSync('CREATE INDEX IF NOT EXISTS idx_tx_name ON transactions(name);');
  // Independent wallet ledger: balance moves only when money actually moves,
  // never when a receipt row is deleted.
  db.execSync(`CREATE TABLE IF NOT EXISTS wallet (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    balance REAL NOT NULL
  );`);
  const row = db.getFirstSync('SELECT COUNT(*) AS count FROM transactions;');
  if (row && row.count === 0) {
    for (const [name, detail, amount, kind, tgroup, icon] of SEED) {
      db.runSync(
        'INSERT INTO transactions (name, detail, amount, kind, tgroup, icon) VALUES (?, ?, ?, ?, ?, ?);',
        [name, detail, amount, kind, tgroup, icon]
      );
    }
    db.runSync('INSERT INTO wallet (id, balance) VALUES (1, ?);', [24580.5]);
  } else {
    const w = db.getFirstSync('SELECT balance FROM wallet WHERE id = 1;');
    if (!w) db.runSync('INSERT INTO wallet (id, balance) VALUES (1, ?);', [24580.5]);
  }
  db.execSync(`CREATE TABLE IF NOT EXISTS savings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    balance REAL NOT NULL
  );`);
  const sv = db.getFirstSync('SELECT balance FROM savings WHERE id = 1;');
  if (!sv) db.runSync('INSERT INTO savings (id, balance) VALUES (1, ?);', [0]);
  db.execSync(`CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL
  );`);
  const c = db.getFirstSync('SELECT COUNT(*) AS count FROM contacts;');
  if (c && c.count === 0) {
    db.runSync('INSERT INTO contacts (name, mobile) VALUES (?, ?), (?, ?);', [
      'Maria Santos', '+63 917 111 2233',
      'Jian Aguelo', '+63 912 345 4821',
    ]);
  }
  db.execSync(`CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    mobile TEXT NOT NULL,
    address TEXT NOT NULL
  );`);
  const p = db.getFirstSync('SELECT COUNT(*) AS count FROM profile;');
  if (p && p.count === 0) {
    db.runSync('INSERT INTO profile (id, name, email, mobile, address) VALUES (1, ?, ?, ?, ?);', [
      'Jian Aguelo',
      'jian@email.com',
      '+63 912 345 4821',
      '',
    ]);
  }
  try {
    db.execSync("ALTER TABLE profile ADD COLUMN avatar TEXT NOT NULL DEFAULT '';");
  } catch (e) {}
  try {
    db.execSync('ALTER TABLE profile ADD COLUMN frozen INTEGER NOT NULL DEFAULT 0;');
  } catch (e) {}
  try {
    db.execSync('ALTER TABLE profile ADD COLUMN spend_limit REAL NOT NULL DEFAULT 0;');
  } catch (e) {}
}

export function getBalance() {
  const w = db.getFirstSync('SELECT balance FROM wallet WHERE id = 1;');
  return w ? w.balance : 24580.5;
}

export function adjustBalance(delta) {
  db.runSync('UPDATE wallet SET balance = balance + ? WHERE id = 1;', [delta]);
}

export function getSavings() {
  const w = db.getFirstSync('SELECT balance FROM savings WHERE id = 1;');
  return w ? w.balance : 0;
}

export function adjustSavings(delta) {
  db.runSync('UPDATE savings SET balance = balance + ? WHERE id = 1;', [delta]);
}

export function getContacts() {
  return db.getAllSync('SELECT * FROM contacts ORDER BY name ASC;');
}

export function addContactGetId(name, mobile) {
  db.runSync('INSERT INTO contacts (name, mobile) VALUES (?, ?);', [name, mobile]);
  const r = db.getFirstSync('SELECT last_insert_rowid() AS id;');
  return r ? r.id : null;
}

export function deleteContact(id) {
  db.runSync('DELETE FROM contacts WHERE id = ?;', [id]);
}

export function getProfile() {
  return (
    db.getFirstSync('SELECT name, email, mobile, address, avatar, frozen, spend_limit FROM profile WHERE id = 1;') || {
      name: 'Jian Aguelo',
      email: 'jian@email.com',
      mobile: '',
      address: '',
      avatar: '',
      frozen: 0,
      spend_limit: 0,
    }
  );
}

export function saveProfile(name, email, mobile, address, avatar) {
  const prev = getProfile();
  db.runSync(
    'UPDATE profile SET name = ?, email = ?, mobile = ?, address = ?, avatar = ? WHERE id = 1;',
    [name, email, mobile, address, avatar === undefined ? prev.avatar || '' : avatar]
  );
}

export function setFrozen(v) {
  db.runSync('UPDATE profile SET frozen = ? WHERE id = 1;', [v ? 1 : 0]);
}

export function setSpendLimit(v) {
  db.runSync('UPDATE profile SET spend_limit = ? WHERE id = 1;', [v]);
}

export function getTodaySpent() {
  const r = db.getFirstSync(
    "SELECT COALESCE(SUM(-amount), 0) AS spent FROM transactions WHERE tgroup = 'Today' AND amount < 0;"
  );
  return r ? r.spent : 0;
}

// Returns { title, msg } when a money-out amount must be blocked, else null.
export function spendBlocked(amount) {
  const p = getProfile();
  if (p && p.frozen) {
    return { title: 'Card frozen', msg: 'Unfreeze your card in the Cards tab to continue.' };
  }
  const limit = p && p.spend_limit ? p.spend_limit : 0;
  if (limit > 0) {
    const spent = getTodaySpent();
    if (spent + amount > limit) {
      return {
        title: 'Daily limit reached',
        msg: `Spent ${fmtMoney(spent)} of ${fmtMoney(limit)} today. This needs ${fmtMoney(amount)} more.`,
      };
    }
  }
  return null;
}

function fmtMoney(n) {
  return '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });
}

export function getTransactions(search = '') {
  if (!search.trim()) {
    return db.getAllSync('SELECT * FROM transactions ORDER BY id DESC;');
  }
  return db.getAllSync('SELECT * FROM transactions WHERE name LIKE ? ORDER BY name ASC;', [
    `%${search}%`,
  ]);
}

export function addTransaction(name, detail, amount, kind, tgroup, icon) {
  db.runSync(
    'INSERT INTO transactions (name, detail, amount, kind, tgroup, icon) VALUES (?, ?, ?, ?, ?, ?);',
    [name, detail, amount, kind, tgroup, icon]
  );
}

export function deleteTransaction(id) {
  db.runSync('DELETE FROM transactions WHERE id = ?;', [id]);
}

export function clearTransactions() {
  db.runSync('DELETE FROM transactions;');
}

export function reseedTransactions() {
  const row = db.getFirstSync('SELECT COUNT(*) AS count FROM transactions;');
  if (row && row.count > 0) return false;
  for (const [name, detail, amount, kind, tgroup, icon] of SEED) {
    db.runSync(
      'INSERT INTO transactions (name, detail, amount, kind, tgroup, icon) VALUES (?, ?, ?, ?, ?, ?);',
      [name, detail, amount, kind, tgroup, icon]
    );
  }
  return true;
}

export function addTransactionGetId(name, detail, amount, kind, tgroup, icon) {
  db.runSync(
    'INSERT INTO transactions (name, detail, amount, kind, tgroup, icon) VALUES (?, ?, ?, ?, ?, ?);',
    [name, detail, amount, kind, tgroup, icon]
  );
  const r = db.getFirstSync('SELECT last_insert_rowid() AS id;');
  return r ? r.id : null;
}

export function getTransactionById(id) {
  return db.getFirstSync('SELECT * FROM transactions WHERE id = ?;', [id]);
}

export function getTotals() {
  const r =
    db.getFirstSync(
      "SELECT COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) AS income, COALESCE(SUM(CASE WHEN amount < 0 THEN -amount ELSE 0 END), 0) AS spent FROM transactions;"
    ) || { income: 0, spent: 0 };
  return r;
}

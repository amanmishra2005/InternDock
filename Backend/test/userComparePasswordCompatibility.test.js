const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');
const { ensureAdminAccount } = require('../config/db');

test('comparePassword accepts legacy plain-text password and migrates it to a bcrypt hash', async () => {
  const user = new User({
    fullName: 'Legacy User',
    email: 'legacy@example.com',
    password: 'plain-text-password',
    role: 'student',
    isActive: true,
  });

  user.save = async function () {
    this.wasSaved = true;
    return this;
  };

  assert.equal(await user.comparePassword('plain-text-password'), true);
  assert.equal(user.wasSaved, true);
  assert.match(user.password, /^\$2[aby]\$/);
});

test('ensureAdminAccount creates or repairs the configured admin account without relying on domain seeding', async () => {
  const created = {};
  const fakeUser = {
    findOne: async () => null,
    create: async (doc) => {
      created.doc = doc;
      return doc;
    },
  };

  await ensureAdminAccount({
    User: fakeUser,
    env: {
      ADMIN_EMAIL: 'ADMIN@EXAMPLE.COM',
      ADMIN_PASSWORD: 'StrongPassword123!',
      ADMIN_NAME: 'Program Admin',
    },
    logger: { log() {}, warn() {} },
  });

  assert.equal(created.doc.email, 'admin@example.com');
  assert.equal(created.doc.role, 'admin');
  assert.equal(created.doc.fullName, 'Program Admin');
  assert.equal(created.doc.password, 'StrongPassword123!');
});

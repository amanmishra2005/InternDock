const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');

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

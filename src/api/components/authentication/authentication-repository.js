// const { attempt } = require('lodash');
const { User, Time } = require('../../../models');
const { lastLogin, attempts } = require('../../../models/time-schema');

/**
 * Get user by email for login information
 * @param {string} email - Email
 * @returns {Promise}
 */
async function getUserByEmail(email) {
  return User.findOne({ email });
}

/**
 * Create a Time schema to save Last Login
 * @param {string} email - Email
 * @param {Date} currentDate - Current Date
 * @returns {Promise}
 */
async function createLastLogin(email, currentDate) {
  return Time.create({
    email,
    lastLogin: currentDate,
    attempts: 0,
  });
}

/**
 * Update Last Login when user logged in again
 * @param {string} email - Email
 * @param {Date} lastLogin - Last Login
 * @param {Number} attempts - Attempts
 * @returns {Promise}
 */
async function updateLastLogin(email, lastLogin, attempts) {
  return Time.updateOne(
    {
      email: email,
    },
    {
      $set: {
        lastLogin: lastLogin,
        attempts: attempts,
      },
    }
  );
}

/**
 * Get Last Login by email
 * @param {string} email - Email
 * @returns {Promise}
 */
async function getLastLoginByEmail(email) {
  return Time.findOne({ email });
}

module.exports = {
  getUserByEmail,
  createLastLogin,
  updateLastLogin,
  getLastLoginByEmail,
};

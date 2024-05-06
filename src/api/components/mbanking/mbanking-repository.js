const { Bank } = require('../../../models');

/**
 * Get a list of users (For Admin)
 * @returns {Promise}
 */
async function getUsers() {
  return Bank.find({});
}

/**
 * Get user detail (For admin)
 * @param {string} id - User ID
 * @returns {Promise}
 */
async function getUser(id) {
  return Bank.findById(id);
}

/**
 * Get user by email to prevent duplicate email
 * @param {string} email - Email
 * @returns {Promise}
 */
async function getUserByEmail(email) {
  return Bank.findOne({ email });
}

/**
 * Get user by account number so user can input it based on data they have
 * @param {string} accNum - Account number
 * @returns {Promise}
 */
async function getUserByAccountNumber(accNum) {
  return Bank.findOne({ no_rek: accNum });
}

/**
 * Get user by noTelp to prevent duplicate noTelp
 * @param {string} noTelp - Telephone Number
 * @returns {Promise}
 */
async function getUserByNoTelp(noTelp) {
  return Bank.findOne({ no_telp: noTelp });
}

/**
 * Create new user
 * @param {string} name - Name
 * @param {string} email - Email
 * @param {string} password - Hashed password
 * @returns {Promise}
 */
async function createUser(accNum, name, email, noTelp, balance, password) {
  return Bank.create({
    no_rek: accNum,
    name,
    email,
    no_telp: noTelp,
    balance,
    password,
  });
}

/**
 * Update balance of an user
 * @param {string} name - Name
 * @param {string} email - Email
 * @returns {Promise}
 */
async function updateBalance(accNum, balance) {
  return Bank.updateOne(
    {
      no_rek: accNum,
    },
    {
      $set: {
        balance: balance,
      },
    }
  );
}

/**
 * Delete an user (For Admin)
 * @param {string} id - User ID
 * @returns {Promise}
 */
async function deleteUser(id) {
  return Bank.deleteOne({ _id: id });
}

/**
 * Update user password
 * @param {string} id - User ID
 * @param {string} password - New hashed password
 * @returns {Promise}
 */
async function changePassword(id, password) {
  return Bank.updateOne({ _id: id }, { $set: { password } });
}

/**
 * Get balance by account number so user can see their balance
 * @param {string} accNum - Account Number
 * @returns {Promise}
 */
async function getBalanceByAccountNumber(accNum) {
  const user = await Bank.findOne({ no_rek: accNum });
  return user.balance;
}

module.exports = {
  getUsers,
  getUser,
  getUserByEmail,
  getUserByNoTelp,
  getUserByAccountNumber,
  createUser,
  updateBalance,
  changePassword,
  deleteUser,
  getBalanceByAccountNumber,
};

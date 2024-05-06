const mbankingRepository = require('./mbanking-repository');
const { hashPassword, passwordMatched } = require('../../../utils/password');
const { errorResponder, errorTypes } = require('../../../core/errors');
const { no_telp, balance } = require('../../../models/mbanking-schema');
const { reduce } = require('lodash');

/**
 * Get list of users (For Admin)
 * @returns {Array}
 */
async function getUsers() {
  const users = await mbankingRepository.getUsers();

  const results = [];
  for (let i = 0; i < users.length; i += 1) {
    const user = users[i];
    results.push({
      id: user.id,
      account_number: user.no_rek,
      name: user.name,
      email: user.email,
      no_telp: user.no_telp,
      balance: user.balance,
    });
  }

  return results;
}

/**
 * Get user detail (For Admin)
 * @param {string} id - User ID
 * @returns {Object}
 */
async function getUser(id) {
  const user = await mbankingRepository.getUser(id);

  // User not found
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    no_telp: user.no_telp,
    balance: user.balance,
  };
}

/**
 * Create new user
 * @param {string} name - Name
 * @param {string} email - Email
 * @param {string} noTelp - Telephone Number
 * @param {Number} balance - Balance
 * @param {string} password - Password
 * @returns {boolean}
 */
async function createUser(name, email, noTelp, balance, password) {
  // Hash password
  const hashedPassword = await hashPassword(password);
  const accNum = await generateAccountNumber();

  try {
    await mbankingRepository.createUser(
      accNum,
      name,
      email,
      noTelp,
      balance,
      hashedPassword
    );
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Delete user (For Admin)
 * @param {string} id - User ID
 * @returns {boolean}
 */
async function deleteUser(id) {
  const user = await mbankingRepository.getUser(id);

  // User not found
  if (!user) {
    return null;
  }

  try {
    await mbankingRepository.deleteUser(id);
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Check whether the email is registered already
 * @param {string} email - Email
 * @returns {boolean}
 */
async function emailIsRegistered(email) {
  const user = await mbankingRepository.getUserByEmail(email);

  if (user) {
    return true;
  }

  return false;
}

/**
 * Check whether the noTelp is registered
 * @param {string} noTelp - Telephone Number
 * @returns {boolean}
 */
async function noTelpIsRegistered(noTelp) {
  const user = await mbankingRepository.getUserByNoTelp(noTelp);

  if (user) {
    return true;
  }

  return false;
}

/**
 * Check whether the password is correct
 * @param {string} userId - User ID
 * @param {string} password - Password
 * @returns {boolean}
 */
async function checkPassword(userId, password) {
  const user = await mbankingRepository.getUser(userId);
  return passwordMatched(password, user.password);
}

/**
 * Change user password
 * @param {string} userId - User ID
 * @param {string} password - Password
 * @returns {boolean}
 */
async function changePassword(userId, password) {
  const user = await mbankingRepository.getUser(userId);

  // Check if user not found
  if (!user) {
    return null;
  }

  const hashedPassword = await hashPassword(password);
  const changeSuccess = await mbankingRepository.changePassword(
    userId,
    hashedPassword
  );

  if (!changeSuccess) {
    return null;
  }

  return true;
}

/**
 * Change the balance whether addMoney or reduceMoney
 * @param {string} accNum - Account number
 * @param {Number} balanceChange - Amount added or reduced
 * @returns
 */
async function modifyBalance(accNum, balanceChange) {
  try {
    const user = await mbankingRepository.getUserByAccountNumber(accNum);

    // Check if user not found
    if (!!user === false) {
      return false;
    }

    const currentBalance = await passBalanceByAccountNumber(accNum);

    const newBalance = currentBalance + balanceChange;

    // Return 2 is made for balance not enough to do any transaction
    if (newBalance < 0) {
      return 2;
    }

    const changeSuccess = await mbankingRepository.updateBalance(
      accNum,
      newBalance
    );
    if (!changeSuccess) {
      return false;
    }

    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Transfer from a bank to another bank inside the database
 * @param {string} targetBank - Target where the money will be ttrasfered to
 * @param {string} sourceBank - The bank account that will send the money
 * @param {Number} nominal - The amount of money transferred
 * @returns
 */
async function transferSameBank(targetBank, sourceBank, nominal) {
  try {
    const targetBalance =
      await mbankingRepository.getBalanceByAccountNumber(targetBank);

    // Return 2 is made for balance not enough to do any transaction
    if (targetBalance - nominal < 0) {
      return 2;
    } else if (!!targetBalance === false) {
      return false;
    }

    const sourceBalance =
      await mbankingRepository.getBalanceByAccountNumber(sourceBank);
    if (!!sourceBalance === false) {
      return false;
    }

    let newSourceBalance = sourceBalance - nominal;
    const reduceSuccess = await mbankingRepository.updateBalance(
      sourceBank,
      newSourceBalance
    );
    if (!!reduceSuccess === false) {
      return false;
    }

    let newTargetBalance = targetBalance + nominal;
    const addSuccess = await mbankingRepository.updateBalance(
      targetBank,
      newTargetBalance
    );
    if (!!addSuccess === false) {
      return false;
    }

    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Generate a random number with the amount of 10 digit for being used as account number
 * @returns {string} accNumUpdated - Account Number
 */
async function generateAccountNumber() {
  let isAccNumberRegistered;
  let accNum;
  let accNumUpdated;

  do {
    accNum = Math.floor(Math.random() * (999999999 - 10000)) + 10000;
    accNumUpdated = accNum.toString();
    accNumUpdated = str.padStart(10, '0');
    isAccNumberRegistered =
      await mbankingRepository.getUserByAccountNumber(str);
  } while (!!isAccNumberRegistered);

  return accNumUpdated;
}

/**
 * Get balance by account number
 * @param {String} accNum
 * @returns {Number} newBalance - Balance of the account
 */
async function passBalanceByAccountNumber(accNum) {
  const newBalance = await mbankingRepository.getBalanceByAccountNumber(accNum);
  return newBalance;
}

module.exports = {
  getUsers,
  getUser,
  createUser,
  deleteUser,
  noTelpIsRegistered,
  emailIsRegistered,
  checkPassword,
  changePassword,
  modifyBalance,
  transferSameBank,
  passBalanceByAccountNumber,
};

const mbankingService = require('./mbanking-service');
const { errorResponder, errorTypes } = require('../../../core/errors');
const { parse } = require('dotenv');
const { use } = require('passport');
const { balance } = require('../../../models/mbanking-schema');

const logger = require('../../../core/logger')('app');

/**
 * Handle get users of users request (For Admin)
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function getUsers(request, response, next) {
  try {
    const users = await mbankingService.getUsers();
    return response.status(200).json(users);
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle get user detail request (For Admin)
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function getUser(request, response, next) {
  try {
    const user = await mbankingService.getUser(request.params.id);

    if (!user) {
      throw errorResponder(errorTypes.UNPROCESSABLE_ENTITY, 'Unknown user');
    }

    return response.status(200).json(user);
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle get balance detail request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function getBalance(request, response, next) {
  try {
    const accNum = request.body.account_number;

    const user = await mbankingService.passBalanceByAccountNumber(accNum);

    if (!user) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Account number is invalid'
      );
    }

    return response.status(200).json('Your Balance: $' + user);
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle create user request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function createUser(request, response, next) {
  try {
    const name = request.body.name;
    const email = request.body.email;
    const noTelp = request.body.no_telp;
    const balance = request.body.initial_balance;
    const password = request.body.password;
    const password_confirm = request.body.password_confirm;

    // Check confirmation password
    if (password !== password_confirm) {
      throw errorResponder(
        errorTypes.INVALID_PASSWORD,
        'Password confirmation mismatched'
      );
    }

    // Email must be unique
    const emailIsRegistered = await mbankingService.emailIsRegistered(email);
    if (emailIsRegistered) {
      throw errorResponder(
        errorTypes.EMAIL_ALREADY_TAKEN,
        'Email is already registered'
      );
    }

    // Telephone Number must be unique
    const noTelpIsRegistered = await mbankingService.noTelpIsRegistered(noTelp);
    if (noTelpIsRegistered) {
      throw errorResponder(
        errorTypes.TELEPHONE_NUMBER_TAKEN,
        'Telephone number is already registered'
      );
    }

    const success = await mbankingService.createUser(
      name,
      email,
      noTelp,
      balance,
      password
    );
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to create user'
      );
    }

    return response.status(200).json({ name, email, no_telp: noTelp, balance });
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle change user password request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function changePassword(request, response, next) {
  try {
    // Check password confirmation
    if (request.body.password_new !== request.body.password_confirm) {
      throw errorResponder(
        errorTypes.INVALID_PASSWORD,
        'Password confirmation mismatched'
      );
    }

    // Check old password
    if (
      !(await mbankingService.checkPassword(
        request.params.id,
        request.body.password_old
      ))
    ) {
      throw errorResponder(errorTypes.INVALID_CREDENTIALS, 'Wrong password');
    }

    const changeSuccess = await mbankingService.changePassword(
      request.params.id,
      request.body.password_new
    );

    if (!changeSuccess) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to change password'
      );
    }

    return response.status(200).json({ id: request.params.id });
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle deposit money to account request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function addMoney(request, response, next) {
  try {
    const accNum = request.body.account_number;
    const addedMoney = request.body.deposit;

    const success = await mbankingService.modifyBalance(accNum, addedMoney);
    if (success === false) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to do deposit'
      );
    }

    const newBalance = await mbankingService.passBalanceByAccountNumber(accNum);

    return response
      .status(200)
      .json('New balance: $' + newBalance + '. Deposit successfully.');
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle pay with bank account request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function reduceMoney(request, response, next) {
  try {
    const accNum = request.body.account_number;
    let payment = request.body.pay;

    reducedMoney = 0 - payment;
    const oldBalance = await mbankingService.passBalanceByAccountNumber(accNum);

    const reduceMoney = await mbankingService.modifyBalance(
      accNum,
      reducedMoney
    );
    if (reduceMoney === 2) {
      throw errorResponder(
        errorTypes.NO_MONEY_AVAILABLE,
        'No enough money for payment. Your Balance: $' + oldBalance
      );
    }
    if (reduceMoney === false) {
      throw errorResponder(errorTypes.UNPROCESSABLE_ENTITY, 'Failed to pay');
    }

    const newBalance = await mbankingService.passBalanceByAccountNumber(accNum);

    return response
      .status(200)
      .json('New balance: $' + newBalance + '. Payment is successful.');
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle transfer to same bank request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function transferSameBank(request, response, next) {
  try {
    const targetBank = request.body.target_bank;
    const sourceBank = request.body.source_bank;
    const nominal = request.body.nominal;

    const success = await mbankingService.transferSameBank(
      targetBank,
      sourceBank,
      nominal
    );
    if (success === 2) {
      throw errorResponder(
        errorTypes.NO_MONEY_AVAILABLE,
        'No enough money for payment. Your Balance: $' + oldBalance
      );
    } else if (success === false) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to transfer.'
      );
    }

    const newBalance =
      await mbankingService.passBalanceByAccountNumber(sourceBank);

    return response
      .status(200)
      .json('Transaction was successful. Your current balance: $' + newBalance);
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle delete user request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function deleteUser(request, response, next) {
  try {
    const id = request.params.id;

    const success = await mbankingService.deleteUser(id);
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to delete user'
      );
    }

    return response.status(200).json({ id });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getUsers,
  getUser,
  getBalance,
  createUser,
  changePassword,
  addMoney,
  reduceMoney,
  transferSameBank,
  deleteUser,
};

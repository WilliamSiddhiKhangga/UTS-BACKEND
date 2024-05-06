const express = require('express');

const authenticationMiddleware = require('../../middlewares/authentication-middleware');
const celebrate = require('../../../core/celebrate-wrappers');
const mbankingControllers = require('./mbanking-controller');
const mbankingValidator = require('./mbanking-validator');

const route = express.Router();

module.exports = (app) => {
  // Default URL
  app.use('/bank', route);

  // Get list of users
  route.get('/', authenticationMiddleware, mbankingControllers.getUsers);

  // Get balance by account number
  route.get(
    '/get-balance',
    authenticationMiddleware,
    mbankingControllers.getBalance
  );

  // Create user
  route.post(
    '/',
    authenticationMiddleware,
    celebrate(mbankingValidator.createUser),
    mbankingControllers.createUser
  );

  // Get user detail
  route.get('/:id', authenticationMiddleware, mbankingControllers.getUser);

  // Deposit
  route.put(
    '/deposit',
    authenticationMiddleware,
    celebrate(mbankingValidator.addMoney),
    mbankingControllers.addMoney
  );

  // Payment
  route.put(
    '/pay',
    authenticationMiddleware,
    celebrate(mbankingValidator.reduceMoney),
    mbankingControllers.reduceMoney
  );

  // Transfer Money to Same Bank
  route.put(
    '/transfer',
    authenticationMiddleware,
    celebrate(mbankingValidator.transferSameBank),
    mbankingControllers.transferSameBank
  );

  // Delete user
  route.delete(
    '/:id',
    authenticationMiddleware,
    mbankingControllers.deleteUser
  );

  // Change password
  route.post(
    '/:id/change-password',
    authenticationMiddleware,
    celebrate(mbankingValidator.changePassword),
    mbankingControllers.changePassword
  );
};

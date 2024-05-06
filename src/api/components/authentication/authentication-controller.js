const { attempt } = require('lodash');
const { errorResponder, errorTypes } = require('../../../core/errors');
const { passwordMatched } = require('../../../utils/password');
const authenticationServices = require('./authentication-service');
const { createLastLogin } = require('./authentication-repository');
// const { currentAttempts } = require('../../../models/time-schema');
// const logger = require('../../../core/logger');
const logger = require('../../../core/logger')('app');

/**
 * Handle login request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function login(request, response, next) {
  const { email, password } = request.body;

  try {
    // Return true if password is matched
    const passwordMatched =
      await authenticationServices.checkPasswordSimilarity(email, password);

    const waitingTime = 30;
    const attemptsGiven = 5;

    // Check whether the user is allowed to login or not
    const lastLoginIsValid = await authenticationServices.tryLogin(
      email,
      passwordMatched
    );

    let currentAttempts =
      await authenticationServices.passAttemptsFromRepository(email);
    let attemptsRemaining = attemptsGiven - currentAttempts;

    if (lastLoginIsValid === 2) {
      timeRemaining =
        waitingTime - (await authenticationServices.getTimeRemaining(email));
      logger.info(
        'User ' +
          email +
          ' tries to login, but got error 403 because the limit attempt reached.'
      );
      throw errorResponder(
        errorTypes.FORBIDDEN,
        'Too many failed login attempts. Time remaining: ' +
          Math.floor(timeRemaining) +
          ' minutes'
      );
    } else if (lastLoginIsValid === false && currentAttempts < attemptsGiven) {
      logger.info(
        'User ' +
          email +
          ' failed to login. Attempt: ' +
          currentAttempts +
          '. Attempts Remaining: ' +
          attemptsRemaining
      );
      return response
        .status(200)
        .json(
          'User ' +
            email +
            ' failed to login. Attempt: ' +
            currentAttempts +
            '. Attempts Remaining: ' +
            attemptsRemaining
        );
    } else if (lastLoginIsValid === false) {
      logger.info(
        'User ' +
          email +
          ' failed to login. Attempt: ' +
          currentAttempts +
          '. Attempts Remaining: ' +
          attemptsRemaining +
          '. Limit Reached.'
      );
      return response
        .status(200)
        .json(
          'User ' +
            email +
            ' failed to login. Attempt: ' +
            currentAttempts +
            '. Attempts Remaining: ' +
            attemptsRemaining +
            '. Limit Reached.'
        );
    } else if (lastLoginIsValid === true) {
      // Check login credentials
      const loginSuccess = await authenticationServices.checkLoginCredentials(
        email,
        password
      );

      if (!loginSuccess) {
        throw errorResponder(
          errorTypes.INVALID_CREDENTIALS,
          'Wrong email or something went wrong'
        );
      }
      logger.info('User ' + email + ' successfully logged in.');
      return response.status(200).json(loginSuccess);
    } else {
      return response.json('Something went wrong at attempting login');
    }
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  login,
};

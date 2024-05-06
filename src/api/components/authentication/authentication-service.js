const authenticationRepository = require('./authentication-repository');
const { generateToken } = require('../../../utils/session-token');
const { passwordMatched } = require('../../../utils/password');
// const { attempt } = require('lodash');

/**
 * Check username and password for login.
 * @param {string} email - Email
 * @param {string} password - Password
 * @returns {object} An object containing, among others, the JWT token if the email and password are matched. Otherwise returns null.
 */
async function checkLoginCredentials(email, password) {
  const user = await authenticationRepository.getUserByEmail(email);

  // We define default user password here as '<RANDOM_PASSWORD_FILTER>'
  // to handle the case when the user login is invalid. We still want to
  // check the password anyway, so that it prevents the attacker in
  // guessing login credentials by looking at the processing time.
  const userPassword = user ? user.password : '<RANDOM_PASSWORD_FILLER>';
  const passwordChecked = await passwordMatched(password, userPassword);

  // Because we always check the password (see above comment), we define the
  // login attempt as successful when the `user` is found (by email) and
  // the password matches.
  if (user && passwordChecked) {
    return {
      email: user.email,
      name: user.name,
      user_id: user.id,
      token: generateToken(user.email, user.id),
    };
  }

  return null;
}

/**
 * Check whether the password matches with the one in database
 * @param {string} email - Email
 * @param {string} password - Password
 * @returns {boolean}
 */
async function checkPasswordSimilarity(email, password) {
  const user = await authenticationRepository.getUserByEmail(email);

  const userPassword = user ? user.password : '<RANDOM_PASSWORD_FILLER>';
  const passwordChecked = await passwordMatched(password, userPassword);

  return passwordChecked;
}

/**
 * Try to Login
 * @param {string} email - Email
 * @param {boolean} passwordMatched - password Matched
 * @returns {boolean}
 */
async function tryLogin(email, passwordMatched) {
  const currentDate = new Date();

  let loginSave = await authenticationRepository.getLastLoginByEmail(email);
  if (!!loginSave === false) {
    loginSave = await authenticationRepository.createLastLogin(
      email,
      currentDate
    );
  }

  const waitingTime = 30;
  const timeDifference = (currentDate - loginSave.lastLogin) / 60000;
  const attemptsGiven = 5;
  currentAttempt = await passAttemptsFromRepository(email);
  attemptsRemaining = attemptsGiven - currentAttempt;

  if (passwordMatched) {
    if (currentAttempt < attemptsGiven) {
      await authenticationRepository.updateLastLogin(email, currentDate, 0);
      return true;
    } else {
      if (timeDifference < waitingTime) {
        return 2;
      } else {
        await authenticationRepository.updateLastLogin(email, currentDate, 0);
        return true;
      }
    }
  } else {
    if (currentAttempt < attemptsGiven) {
      await authenticationRepository.updateLastLogin(
        email,
        currentDate,
        currentAttempt + 1
      );
      return false;
    } else {
      if (timeDifference < waitingTime) {
        return 2;
      } else {
        await authenticationRepository.updateLastLogin(email, currentDate, 1);
        return false;
      }
    }
  }
}

/**
 * Pass attempts from repository
 * @param {string} email
 * @returns {Object}
 */
async function passAttemptsFromRepository(email) {
  let loginSave = await authenticationRepository.getLastLoginByEmail(email);
  if (!!loginSave === false) {
    return 0;
  }
  return loginSave.attempts;
}

/**
 * Get Time remaining
 * @param {string} email
 * @returns {Number}
 */
async function getTimeRemaining(email) {
  const currentDate = new Date();
  let loginSave = await authenticationRepository.getLastLoginByEmail(email);

  if (loginSave === null) {
    return 0;
  }

  const timeDifference = (currentDate - loginSave.lastLogin) / 60000;
  return timeDifference;
}

module.exports = {
  checkLoginCredentials,
  checkPasswordSimilarity,
  tryLogin,
  passAttemptsFromRepository,
  getTimeRemaining,
};

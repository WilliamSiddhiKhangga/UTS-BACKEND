const express = require('express');

const authentication = require('./components/authentication/authentication-route');
const users = require('./components/users/users-route');
const bank = require('./components/mbanking/mbanking-route');

module.exports = () => {
  const app = express.Router();

  authentication(app);
  users(app);
  bank(app);

  return app;
};

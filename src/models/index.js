const mongoose = require('mongoose');
const config = require('../core/config');
const logger = require('../core/logger')('app');

const usersSchema = require('./users-schema');
const timeSchema = require('./time-schema');
const mbankingSchema = require('./mbanking-schema');

mongoose.connect(`${config.database.connection}/${config.database.name}`, {
  useNewUrlParser: true,
});

const db = mongoose.connection;
db.once('open', () => {
  logger.info('Successfully connected to MongoDB');
});

const User = mongoose.model('users', mongoose.Schema(usersSchema));
const Time = mongoose.model('time', mongoose.Schema(timeSchema));
const Bank = mongoose.model('mbanking', mongoose.Schema(mbankingSchema));

module.exports = {
  mongoose,
  User,
  Time,
  Bank,
};

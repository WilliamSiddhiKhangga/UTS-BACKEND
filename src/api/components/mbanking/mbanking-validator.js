const joi = require('joi');
const { joiPasswordExtendCore } = require('joi-password');
const { transferSameBank } = require('./mbanking-service');
const joiPassword = joi.extend(joiPasswordExtendCore);

module.exports = {
  createUser: {
    body: {
      name: joi.string().min(1).max(100).required().label('Name'),
      email: joi.string().email().required().label('Email'),
      no_telp: joi.string().min(11).required().label('Telephone Number'),
      initial_balance: joi.number().required().label('Balance'),
      password: joiPassword
        .string()
        .minOfSpecialCharacters(1)
        .minOfLowercase(1)
        .minOfUppercase(1)
        .minOfNumeric(1)
        .noWhiteSpaces()
        .onlyLatinCharacters()
        .min(6)
        .max(32)
        .required()
        .label('Password'),
      password_confirm: joi.string().required().label('Password confirmation'),
    },
  },

  addMoney: {
    body: {
      account_number: joi.string().required().label('Account Number'),
      deposit: joi.number().required().label('Deposit'),
    },
  },

  reduceMoney: {
    body: {
      account_number: joi.string().required().label('Account Number'),
      pay: joi.number().required().label('Payment'),
    },
  },

  transferSameBank: {
    body: {
      target_bank: joi.string().required().label('Target Bank'),
      source_bank: joi.string().required().label('Source Bank'),
      nominal: joi.number().required().label('Nominal'),
    },
  },

  changePassword: {
    body: {
      password_old: joi.string().required().label('Old password'),
      password_new: joiPassword
        .string()
        .minOfSpecialCharacters(1)
        .minOfLowercase(1)
        .minOfUppercase(1)
        .minOfNumeric(1)
        .noWhiteSpaces()
        .onlyLatinCharacters()
        .min(6)
        .max(32)
        .required()
        .label('New password'),
      password_confirm: joi.string().required().label('Password confirmation'),
    },
  },
};

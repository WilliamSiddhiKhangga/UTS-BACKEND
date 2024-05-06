const usersRepository = require('./users-repository');
const { hashPassword, passwordMatched } = require('../../../utils/password');
const { errorResponder, errorTypes } = require('../../../core/errors');

/**
 * Separate the SearchParameter with SearchValue
 * @param {string} search 
 * @returns {object}
 */
async function searchSeparator(search) {
  let searchParameter, searchValue;

  if (search) {
    const searchAttribute = search.match(/^([^:]+):(.*)$/);
    if (searchAttribute) {
      searchParameter = searchAttribute[1].trim();
      searchValue = searchAttribute[2].trim();
    }
    return { searchParameter, searchValue };
  }

  return 0;
}

/**
 * Separate the SortParameter with SortValue
 * @param {string} sort 
 * @returns {object}
 */
async function sortSeparator(sort) {
  let sortParameter, sortValue;

  if (sort) {
    const sortAttribute = sort.match(/^([^:]+):(.*)$/);
    if (sortAttribute) {
      sortParameter = sortAttribute[1].trim();
      sortValue = sortAttribute[2].trim();
    }
    return { sortParameter, sortValue };
  }

  return 0;
}

/**
 * Get list of users
 * @returns {Array}
 */
async function getUsers(
  pageNumber,
  pageSize,
  searchParameter,
  searchValue,
  sortParameter,
  sortValue
) {
  const users = await usersRepository.getUsers(pageNumber, pageSize);
  const data = [];

  if (searchParameter && searchValue) {
    for (let i = 0; i < users.length; i += 1) {
      const user = users[i];
      if (user[searchParameter] === searchValue) {
        data.push({
          id: user.id,
          name: user.name,
          email: user.email,
        });
      }
    }
  } else {
    for (let i = 0; i < users.length; i += 1) {
      const user = users[i];
      data.push({
        id: user.id,
        name: user.name,
        email: user.email,
      });
    }
  }

  if (!!sortParameter === false) {
    sortParameter = 'email';
  }

  if (sortParameter) {
    if (sortParameter === 'id') {
      data.sort((a, b) => {
        if (sortValue === 'desc') {
          return b.id - a.id;
        } else {
          return a.id - b.id;
        }
      });
    } else {
      if (sortValue === 'desc') {
        data.sort((a, b) => b[sortParameter].localeCompare(a[sortParameter]));
      } else {
        data.sort((a, b) => a[sortParameter].localeCompare(b[sortParameter]));
      }
    }
  }

  let { count, totalPages, hasPreviousPages, hasNextPages } =
    await getAttributes(pageNumber, pageSize);

  return { data, count, totalPages, hasPreviousPages, hasNextPages };
}

/**
 * Get user detail
 * @param {string} id - User ID
 * @returns {Object}
 */
async function getUser(id) {
  const user = await usersRepository.getUser(id);

  // User not found
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

/**
 * Create new user
 * @param {string} name - Name
 * @param {string} email - Email
 * @param {string} password - Password
 * @returns {boolean}
 */
async function createUser(name, email, password) {
  // Hash password
  const hashedPassword = await hashPassword(password);

  try {
    await usersRepository.createUser(name, email, hashedPassword);
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Update existing user
 * @param {string} id - User ID
 * @param {string} name - Name
 * @param {string} email - Email
 * @returns {boolean}
 */
async function updateUser(id, name, email) {
  const user = await usersRepository.getUser(id);

  // User not found
  if (!user) {
    return null;
  }

  try {
    await usersRepository.updateUser(id, name, email);
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Delete user
 * @param {string} id - User ID
 * @returns {boolean}
 */
async function deleteUser(id) {
  const user = await usersRepository.getUser(id);

  // User not found
  if (!user) {
    return null;
  }

  try {
    await usersRepository.deleteUser(id);
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Check whether the email is registered
 * @param {string} email - Email
 * @returns {boolean}
 */
async function emailIsRegistered(email) {
  const user = await usersRepository.getUserByEmail(email);

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
  const user = await usersRepository.getUser(userId);
  return passwordMatched(password, user.password);
}

/**
 * Change user password
 * @param {string} userId - User ID
 * @param {string} password - Password
 * @returns {boolean}
 */
async function changePassword(userId, password) {
  const user = await usersRepository.getUser(userId);

  // Check if user not found
  if (!user) {
    return null;
  }

  const hashedPassword = await hashPassword(password);
  const changeSuccess = await usersRepository.changePassword(
    userId,
    hashedPassword
  );

  if (!changeSuccess) {
    return null;
  }

  return true;
}

async function getAttributes(pageNumber, pageSize) {
  const users = await usersRepository.getUsers();
  count = users.length;
  totalPages =
    count % pageSize === 0
      ? Math.floor(count / pageSize)
      : Math.floor(count / pageSize + 1);

  if (!!totalPages === false) {
    totalPages = 1;
  }

  if (!!pageSize === false) {
    pageSize = count;
  }

  hasPreviousPages = pageNumber > 1 ? true : false;
  hasNextPages = pageNumber < totalPages ? true : false;

  return { count, totalPages, hasPreviousPages, hasNextPages };
}

module.exports = {
  searchSeparator,
  sortSeparator,
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  emailIsRegistered,
  checkPassword,
  changePassword,
};

const { urlDatabase } = require("./data")
const { users} = require("./data")

// used to generate ids
function generateRandomString() {
  return Math.random().toString(36).substring(2, 8);
}
//checks if the user id of the url matches the id of the user
function urlsForUser(id) {
  let userUrls = {};
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userUrls[shortURL] = urlDatabase[shortURL];
    }
  }
  return userUrls;
}

//searches users for a user with an email matching the parameter email and returns the userId
function getUserByEmail(email) {
  for (const userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return null;
}

module.exports = {
  generateRandomString,
  urlsForUser,
  getUserByEmail
};
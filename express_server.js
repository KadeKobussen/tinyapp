const express = require("express");
const app = express();
const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(10)
const PORT = 8080; // default port 8080
const cookieSession = require("cookie-session")

app.set("view engine", "ejs");

//sets up middleware to parse incoming request bodies containing URL encoded data.
app.use(express.urlencoded({ extended: true }));

//lets app use cookieSession
app.use(
  cookieSession({
    name: 'session',
    keys: ['I really like the eagles'],
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  })
)
//holds all urls
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
}

//user database
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

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

// asked a mentor about this route while debugging and was told it wasnt needed because urls is our home route??

/*app.get("/", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  
  console.log(userId)
  if (!userId){
    res.redirect("/login");
  }
  else {
    res.redirect("/urls");
  }
});*/

//starts web server that listens for incoming http requests
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//returns the urlDatabase object as a JSON response
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//displays a list of URLs created by the logged-in user
app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const userUrls = urlsForUser(userId);
  const templateVars = { urls: userUrls, user };
  console.log(userId)
  if (!userId) {
    res.status(404).send("Must be logged in to view /urls.");
    //res.redirect("/login");
  } else {
    res.render("urls_index", templateVars);
  }
});

// creates a new short URL for the long URL specified in the request body
app.post("/urls", (req, res) => {
  const userID = req.session.user_id;
  const longURL = req.body.longURL;
  if (!userID) {
    return res.status(401).send("Unauthorized");
  }
  const id = generateRandomString();
  urlDatabase[id] = {
    longURL: longURL,
    userID: userID,
  };
  console.log("test", urlDatabase)
  res.redirect(`/urls/${id}`);
});

//displays the page for creating a new URL
app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId]
  if (typeof userId === "undefined") {
    res.redirect('/login');
    return;
  }
  const templateVars = { users, userId, user };
  res.render("urls_new", templateVars);
});

//displays the long URL and short URL created by the user for the URL ID specified
app.get("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  const user = userId ? users[userId] : null;
  const userUrls = urlsForUser(userId);
  const id = req.params.id;
  if (!user) {
    res.status(404).send("Must be logged in to view /urls/:id");
    return;
  }
  if (!urlDatabase[id]) {
    res.status(404).send("Short URL does not exist.");
    return;
  }
  if (!userUrls[req.params.id]) {
    res.status(404).send("You may only view your own urls");
    return;
  }
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user,
  };
  res.render("urls_show", templateVars);
});


//redirects the user to the long URL for the short URL specified in the request parameter
app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  if (!urlDatabase[shortURL]) {
    res.status(404).send("<h1>Error 404: Not Found</h1><p>The requested URL does not exist.</p>");
    return;
  }
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

//deletes the short URL specified by the ID parameter
app.post("/urls/:id/delete", (req, res) => {
  const userId = req.session.user_id;
  const id = req.params.id;
  delete urlDatabase[id];
  const user = userId ? users[userId] : null;
  res.redirect('/urls');
  if (!user) {
    res.status(404).send("Must be logged in to view /urls/:id");
    return;
  }
  if (!urlDatabase[id]) {
    res.status(404).send("Short URL does not exist.");
    return;
  }
  if (!userUrls[req.params.id]) {
    res.status(404).send("You may only view your own urls");
    return;
  }
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user,
  };
})

//This code updates a URL's longURL value for a logged-in user and redirects them to the /urls page.
app.post("/urls/:id/edit", (req, res) => {
  const userId = req.session.user_id;
  const id = req.params.id;
  const user = userId ? users[userId] : null;
  const userUrls = urlsForUser(userId);
  if (!user) {
    res.status(404).send("Must be logged in to view /urls/:id");
    return;
  }
  if (!urlDatabase[id]) {
    res.status(404).send("Short URL does not exist.");
    return;
  }
  if (!userUrls[req.params.id]) {
    res.status(404).send("You may only edit your own urls");
    return;
  }
  const newURL = req.body.longURL;
  urlDatabase[id].longURL = newURL;
  res.redirect(`/urls`);
});


//updates the longURL property of a specific shortURL in the urlDatabase object and redirects the user to the '/urls' page.
app.post("/urls/:id", (req, res) => {
  const user = users[req.session.user_id];
  const id = req.params.id;
  const newLongURL = req.body.longURL;

  if (!user) {
    res.status(401).send("Must be logged in to edit URLs.");
    return;
  }

  if (!urlDatabase[id]) {
    res.status(404).send("The requested URL does not exist.");
    return;
  }

  if (urlDatabase[id].userID !== user.id) {
    res.status(403).send("You do not have permission to edit this URL.");
    return;
  }

  urlDatabase[id].longURL = newLongURL;
  res.redirect('/urls');
});

//renders the login page if no user is currently logged in, and redirects to /urls if a user is already logged in.
app.get("/login", (req, res) => {
  const userId = req.session.user_id;
  if (userId) {
    res.redirect('/urls');
  } else {
    res.render('login');
  }

  //authenticates the user with the email and password specified in the request body and starts a user session if successful
  app.post("/login", (req, res) => {
    const { email, password } = req.body;
    const user = getUserByEmail(email);

    if (!user) {
      res.status(403).send("Invalid email address");
    } else {
      const samePassword = bcrypt.compareSync(password, user.password);
      if (!samePassword) {
        res.status(403).send("Invalid password");
      } else {
        req.session.user_id = user.id
        res.redirect("/urls");
      }
    }
  });

})

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

//handles a GET request to "/registration" route and renders the registration page if the user is not logged in, otherwise redirects to "/urls"
app.get("/registration", (req, res) => {
  const userId = req.session.user_id;
  const user = userId ? users[userId] : null;
  if (user) {
    res.redirect("/urls")
  }
  res.render("registration", { users: users });
});

//handles the submission of the registration form, creates a new user with a randomly generated ID and hashed password, sets a session cookie for the user, and redirects to the /urls page.
app.post("/registration", (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, salt)
  if (!email || !password) {
    res.status(400).send('Email or password cannot be empty');
    return;
  }
  // Check if the email already exists in the users object
  const existingUser = getUserByEmail(email);
  if (existingUser) {
    res.status(400).send('This email is already in use.');
    return;
  }
  //generate random userID
  const userID = generateRandomString();
  //set new user in users object
  const newUser = {
    id: userID,
    'email': email,
    'password': hashedPassword
  };
  users[userID] = newUser;
  console.log(newUser);
  // Set a user_id session containing the user's newly generated ID
  req.session.user_id = userID
  // Redirect the user to the /urls page
  res.redirect('/urls');
});


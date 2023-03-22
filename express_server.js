const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const PORT = 8080; // default port 8080

//Enables cookie parser
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
  return Math.random().toString(36).substring(2, 8);
}

function getUserByEmail(email) {
  for (const userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return null;
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

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/set", (req, res) => {
  const a = 1;
  res.send(`a = ${a}`);
});

app.get("/fetch", (req, res) => {
  res.send(`a = ${a}`);
});

app.get("/urls", (req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId];
  console.log(user)
  const templateVars = { urls: urlDatabase, user };
  res.render("urls_index", templateVars);

});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies.user_id;
  const user = userId ? users[userId] : null;
  const templateVars = { user };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const userId = req.cookies.user_id;
  const user = userId ? users[userId] : null;
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user,
  };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
 
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  console.log(req.body); // Log the POST request body to the console
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);

});


app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id]
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect('/urls');
})

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const newLongURL = req.body.longURL;
  urlDatabase[id] = newLongURL;
  res.redirect('/urls');
})

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email);

  if (!user) {
    res.status(403).send("Invalid email address");
  } else if (user.password !== password) {
    res.status(403).send("Invalid password");
  } else {
    res.cookie("user_id", user.id);
    res.redirect("/urls");
  }
});
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.get("/registration", (req, res) => {
  res.render("registration", {users: users});
});

app.post("/registration", (req, res) => {
  const { email, password } = req.body;

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
    'password': password
  }; console.log(users);

 

  users[userID] = newUser;

  
  // Set a user_id cookie containing the user's newly generated ID
    res.cookie('user_id', userID);

    // Redirect the user to the /urls page
    res.redirect('/urls');
});

app.get("/login", (req, res) => {
  res.render('login');
})
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const PORT = 8080; // default port 8080

//Enables cookie parser
app.use(cookieParser());
app.set("view engine", "ejs");

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
function urlsForUser(id) {
  let userUrls = {};
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userUrls[shortURL] = urlDatabase[shortURL];
    }
  }
  return userUrls;

}



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
  const userId = req.cookies["user_id"];
  const user = users[userId];
  console.log(user)
  const userUrls = urlsForUser(userId);
  const templateVars = { urls: userUrls, user };
  
  if (!user){
  res.status(404).send("Must be logged in to view /urls.");
    return;
  }
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId]
  console.log(userId)
  if (typeof userId === "undefined") {
    res.redirect('/login');
    return;
  }
  const templateVars = { users, userId, user };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const userId = req.cookies.user_id;
  const user = userId ? users[userId] : null;
  const userUrls = urlsForUser(userId);
  const id = req.params.id;
 console.log(urlDatabase)
  if (!user){
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
    longURL: urlDatabase[req.params.id].longURL,       //******
    user,
  };
  
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  
    const userID = req.cookies.user_id;
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


app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id]             //*****
  if (!longURL) {
    res.status(404).send("The requested URL does not exist.");
    return;
  }
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  const userId = req.cookies.user_id;
  const id = req.params.id;
  delete urlDatabase[id];
  const user = userId ? users[userId] : null;
  res.redirect('/urls');
  
  if (!user){
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
    longURL: urlDatabase[req.params.id].longURL,       //******
    user,
  };
})


app.post("/urls/:id/edit", (req, res) => {
  const userId = req.cookies.user_id;
  const id = req.params.id;
  const user = userId ? users[userId] : null;
  const userUrls = urlsForUser(userId);

  if (!user){
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
  
  res.redirect(`/urls/${id}`);
});



app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const newLongURL = req.body.longURL;
  if (!urlDatabase[id]) {
    res.status(404).send("The requested URL does not exist.");
    return;
  }
  urlDatabase[id].longURL = newLongURL;          //****change left side?
  res.redirect('/urls');
});

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
  const userId = req.cookies.user_id;
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
  const userId = req.cookies.user_id;
  if (userId) {
    res.redirect('/urls');
  } else {
    res.render('login');
  }
})
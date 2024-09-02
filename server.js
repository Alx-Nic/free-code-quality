"use strict";
require("dotenv").config();
const express = require("express");
const myDB = require("./connection");
const session = require("express-session");
const passport = require("passport");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const { ObjectID } = require("mongodb");
const LocalStrategy = require("passport-local");

const app = express();
app.set("view engine", "pug");
app.set("views", "./views/pug");

const showLogin = true;
const showRegistration = true;

fccTesting(app); //For FCC testing purposes
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use(passport.initialize());
app.use(passport.session());

myDB(async (client) => {
  const myDataBase = await client.db("database").collection("users");

  app.route("/").get(async (req, res) => {
    res.render("index", {
      title: "Connected to Database",
      message: "Please log in",
      showLogin,
    });
  });

  app
    .route("/login")
    .post(
      passport.authenticate("local", { failureRedirect: "/" }),
      (req, res) => {
        console.log(`User ${req.user.username} has logged in.`);
        res.redirect("/profile");
      }
    );

  app.route("/profile").get((req, res) => {
    res.render("profile");
  });

  passport.use(
    new LocalStrategy((username, password, done) => {
      myDataBase.findOne({ username: username }, (err, user) => {
        console.log(`User ${username} attempted to log in.`);
        if (err) return done(err);
        if (!user) return done(null, false);
        if (password !== user.password) return done(null, false);
        return done(null, user);
      });
    })
  );

  passport.serializeUser((user, doneCB) => {
    doneCB(null, user._id);
  });

  passport.deserializeUser((id, doneCB) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      doneCB(null, doc);
    });
  });
}).catch((e) => {
  app.route("/").get((req, res) => {
    res.render("pug", {
      title: "e",
      message: "Unable to connect to database",
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});

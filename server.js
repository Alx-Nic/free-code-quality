"use strict";
require("dotenv").config();
const express = require("express");
const myDB = require("./connection");
const session = require("express-session");
const passport = require("passport");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const { ObjectID } = require("mongodb");

const app = express();

fccTesting(app); //For FCC testing purposes
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "pug");
app.set("views", "./views/pug");

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

passport.initialize();
passport.session();

myDB(async (client) => {
  const myDataBase = await client.db("database").collection("users");

  app.route("/").get((req, res) => {
    res.render("index", {
      title: "Connected to Database",
      message: "Please log in",
    });
  });

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

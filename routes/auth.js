"use strict";

const Router = require("express").Router;
const router = new Router();
const jwt = require("jsonwebtoken");

const { BadRequestError } = require("../expressError");
const { SECRET_KEY } = require("../config");

const User = require("../models/user");

/** POST /login: {username, password} => {token} */
router.post("/login", async function (req, res, next) {
  const { username, password } = req.body;

  if (await User.authenticate(username, password) === true) {
    let token = jwt.sign({ username }, SECRET_KEY);
    return res.json({ token });
  }

  throw new BadRequestError("Invalid user/password");
});

/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */
router.post("/register", async function (req, res, next) {
  let user = await User.register(req.body);

  let token = jwt.sign({ username: user.username }, SECRET_KEY);

  return res.json({ token });
});

module.exports = router;
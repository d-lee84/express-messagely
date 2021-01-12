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


/** GET /reset: Inputs the username number to be able to reset password
 *
 * {username} => {message: "Text message sent!"}.
 */
router.get("/reset", async function (req, res, next) {
  let username = req.body.username;
  // resetInfoObj = {resetCode, phone}
  let resetInfoObj = await User.getResetCode(username);

  let message = await User.sendResetSMS(resetInfoObj);

  return res.json({ message });
});

/** POST /reset: Takes in reset_code, username, new password
 *  updates the database then return a response
 *  - Error if its been more than 30 minutes or
 *    if the reset_code is incorrect
 *
 * {username, reset_code, password} => {message: "Password has been reset!"}.
 */
router.post("/reset", async function (req, res, next) {
  const {username, reset_code, password} = req.body;

  let message = await User.resetPassword({username, reset_code, password});

  return res.json({ message });
});

module.exports = router;
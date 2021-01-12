"use strict";

const Router = require("express").Router;
const router = new Router();

const Message = require("../models/message");
const middleware = require("../middleware/auth");

const {UnauthorizedError} = require("../expressError");

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Makes sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get(
  "/:id",
  middleware.authenticateJWT,
  middleware.ensureLoggedIn,
  middleware.getMessage,
  async function (req, res, next) {
    const message = res.locals.message;

    let username = res.locals.user.username;

    // Check whether the user is the sender or recipient of the message 
    let isSender = message.from_user.username === username;
    let isRecipient = message.to_user.username === username;

    if (isSender || isRecipient) {
      return res.json({ message });
    } else {
      throw new UnauthorizedError("You are unauthorized from viewing this");
    }
  }
);

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post(
  "/",
  middleware.authenticateJWT,
  middleware.ensureLoggedIn,
  async function (req, res, next) {
    const {to_username, body} = req.body;
    const from_username = res.locals.user.username;

    const message = await Message.create({ from_username, to_username, body});

    return res.json({message});
  }
);


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Makes sure that the only the intended recipient can mark as read.
 *
 **/
router.post(
  "/:id/read",
  middleware.authenticateJWT,
  middleware.ensureLoggedIn,
  middleware.getMessage,
  async function (req, res, next) {
    let message = res.locals.message;
    let id = req.body.id;

    let currUsername = res.locals.user.username;

    // Check whether the user is the recipient of the message 
    let isRecipient = (message.to_user.username === currUsername);

    if (!isRecipient) {
      throw new UnauthorizedError("You are unauthorized from viewing this");
    }

    message = await Message.markRead(id);

    return res.json({ message });
  }
);


module.exports = router;
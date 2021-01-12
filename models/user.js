"use strict";

const bcrypt = require("bcrypt");
const BCRYPT_WORK_FACTOR = 12;

const db = require("../db");

const {NotFoundError, BadRequestError} = require("../expressError");

/** User of the site. */

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {

    const hashedPassword = await bcrypt.hash(
      password, BCRYPT_WORK_FACTOR);

    try {
      var result = await db.query(
        `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
        VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
        RETURNING username, password, first_name, last_name, phone`,
        [username, hashedPassword, first_name, last_name, phone]);
      } catch (err) {
        throw new BadRequestError("User could not be created");
      }
      const user = result.rows[0];
      return user;
    }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT password FROM users
        WHERE username = $1;`,
       [username]);
    const user = result.rows[0];

    if (user === undefined) return false;
    
    // *** forgetting await here is dangerous ***
    return await bcrypt.compare(password, user.password) === true;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    let results = await db.query(
      `UPDATE users
        SET last_login_at = current_timestamp
       WHERE username = $1
       RETURNING username, last_login_at`, 
       [username]);
    
    let status = results.rows[0];

    if (status === undefined) {
      return false;
    }

    return true;
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const result = await db.query(
      `SELECT username, first_name, last_name 
        FROM users
        ORDER BY last_name DESC, first_name DESC
        LIMIT 100`);
    const users = result.rows;
    
    return users;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {

    const result = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at
        FROM users
        WHERE username = $1`,
      [username]
    );
    let user = result.rows[0];

    if (user === undefined) throw new NotFoundError("User could not be found");

    return user;
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    return await User._getMessages(username, "from");
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    return await User._getMessages(username, "to");
  }

  /** Helper function that is flexible about whether the 
   *  message is from or to the user. 
   */

  static async _getMessages(username, to_or_from) {
    let currentKey = (to_or_from === "to") ? "to_username" : "from_username";
    let otherKey = (to_or_from === "to") ? "from_username" : "to_username";

    // Check to make sure that a specific user with this username exists
    await User.get(username);

    const results = await db.query(
      `SELECT id, ${otherKey}, body, sent_at, read_at
        FROM messages
        WHERE ${currentKey} = $1`,
      [username]
    );

    let messages = results.rows;
    let userInfo = new Map();
    let userKey = (to_or_from === "to") ? "from_user" : "to_user";

    for (let msg of messages) {
      let user;
      if (userInfo.has(msg[otherKey])) {
        user = userInfo.get(msg[otherKey]);
      } else {
        let { username, first_name, last_name, phone } = await User.get(msg[otherKey]);
        user = { username, first_name, last_name, phone };
        userInfo.set(msg[otherKey], user);
      }
        msg[userKey] =  user;
        delete msg[otherKey];
    }

    return messages;

  }
}


module.exports = User;



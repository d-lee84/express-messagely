"use strict";

const bcrypt = require("bcrypt");
const BCRYPT_WORK_FACTOR = 12;

const db = require("../db");

const {NotFoundError} = require("../expressError");

/** User of the site. */

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {

    const hashedPassword = await bcrypt.hash(
      password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
        VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
        RETURNING username, password, first_name, last_name, phone`,
       [username, hashedPassword, first_name, last_name, phone]);
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

    // Maybe shouldn't give back too descriptive of an error
    // if(user === undefined) throw new NotFoundError("Username does not exist");
    if(user === undefined) return false;
    
    return await bcrypt.compare(password, user.password);
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    await db.query(
      `UPDATE users
        SET last_login_at = current_timestamp
       WHERE username = $1`, [username]);
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const result = await db.query(
      `SELECT username, first_name, last_name 
        FROM users`);
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
    // Check to make sure that a specific user with this username exists
    await User.get(username);

    const results = await db.query(
      `SELECT id, to_username, body, sent_at, read_at
        FROM messages
        WHERE from_username = $1`,
      [username]
    );
    
    let messages = results.rows;

    for(let val of messages) {
      let { username, first_name, last_name, phone } = await User.get(val.to_username);
      val.to_user = { username, first_name, last_name, phone };
      delete val.to_username;
    }

    return messages;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    // Check to make sure that a specific user with this username exists
    await User.get(username);

    const results = await db.query(
      `SELECT id, from_username, body, sent_at, read_at
        FROM messages
        WHERE to_username = $1`,
      [username]
    );
    
    let messages = results.rows;

    for(let val of messages) {
      let { username, first_name, last_name, phone } = await User.get(val.from_username);
      val.from_user = { username, first_name, last_name, phone };
      delete val.from_username;
    }

    return messages;
  }
}


module.exports = User;



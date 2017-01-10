'use strict';
/**
 * Calendar module.
 * @module Calendar
 * @author EternityWall
 * @license GPL3
 */

const requestPromise = require('request-promise');
const Promise = require('promise');
const Utils = require('./utils.js');
const Context = require('./context.js');
const Timestamp = require('./timestamp.js');

/** Class representing Remote Calendar server interface */
class RemoteCalendar {

  /**
   * Create a RemoteCalendar.
   * @param {string} url - The server url.
   */
  constructor(url) {
    this.url = url;
  }

  /**
   * This callback is called when the result is loaded.
   *
   * @callback resolve
   * @param {Timestamp} timestamp - The timestamp of the Calendar response.
   */

  /**
   * This callback is called when the result fails to load.
   *
   * @callback reject
   * @param {Error} error - The error that occurred while loading the result.
   */

  /**
   * Submitting a digest to remote calendar. Returns a Timestamp committing to that digest
   * @param {byte[]} digest - The digest hash to send.
   * @returns {Promise} A promise that returns {@link resolve} if resolved
   * and {@link reject} if rejected.
   */
  submit(digest) {
    console.log('digest ', Utils.bytesToHex(digest));

    const options = {
      url: this.url + '/digest',
      method: 'POST',
      headers: {
        Accept: 'application/vnd.opentimestamps.v1',
        'User-Agent': 'javascript-opentimestamps',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      encoding: null,
      body: new Buffer(digest)
    };

    return new Promise((resolve, reject) => {
      requestPromise(options)
              .then(body => {
                console.log('body ', body);
                if (body.size > 10000) {
                  console.log('Calendar response exceeded size limit');
                  return;
                }

                const ctx = new Context.StreamDeserialization();
                ctx.open(Utils.arrayToBytes(body));

                const timestamp = Timestamp.deserialize(ctx, digest);
                resolve(timestamp);
              })
              .catch(err => {
                console.log('Calendar response error: ' + err);
                reject();
              });
    });
  }
}

module.exports = {
  RemoteCalendar
};

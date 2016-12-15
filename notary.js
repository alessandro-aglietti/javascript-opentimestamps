'use strict';

const Context = require('./context.js');

const Utils = require('./utils.js');

class TimeAttestation {

  static _TAG_SIZE() {
    return 8;
  }
  static _MAX_PAYLOAD_SIZE() {
    return 8192;
  }

  static deserialize(ctx) {
    console.log('attestation deserialize');

    const tag = ctx.readBytes(this._TAG_SIZE());
    console.log('tag: ', Utils.bytesToHex(tag));

    console.log('tag(PendingAttestation): ', Utils.bytesToHex(PendingAttestation._TAG()));
    console.log('tag(BitcoinBlockHeaderAttestation): ', Utils.bytesToHex(BitcoinBlockHeaderAttestation._TAG()));

    let serializedAttestation = ctx.readVarbytes(this._MAX_PAYLOAD_SIZE());
    console.log('serializedAttestation: ', Utils.bytesToHex(serializedAttestation));

    const ctxPayload = new Context.StreamDeserialization();
    ctxPayload.open(serializedAttestation);

    if (Utils.arrEq(tag, PendingAttestation._TAG()) === true) {
      console.log('PendingAttestation: ');
      return PendingAttestation.deserialize(ctxPayload);
    }
    if (Utils.arrEq(tag, BitcoinBlockHeaderAttestation._TAG()) === true) {
      console.log('BitcoinBlockHeaderAttestation: ');
      return BitcoinBlockHeaderAttestation.deserialize(ctxPayload);
    }
    console.log('UnknownAttestation: ');
    serializedAttestation = ctxPayload.readVarbytes(this._MAX_PAYLOAD_SIZE());
    return new UnknownAttestation(tag, serializedAttestation);
  }

  serialize() {

  }
}

class UnknownAttestation extends TimeAttestation {

  constructor(tag, payload) {
    super();
    this._TAG = tag;
    this.payload = payload;
  }

  serialize(ctx) {
    ctx.writeVarbytes(UnknownAttestation._TAG());
    this.serializePayload(ctx);
  }

  serializePayload(ctx) {
    ctx.writeBytes(this.payload);
  }

  toString() {
    return 'UnknownAttestation ' + Utils.bytesToHex(this._TAG) + ' ' + Utils.bytesToHex(this.payload);
  }
}

class PendingAttestation extends TimeAttestation {
  static _TAG() {
    return [0x83, 0xdf, 0xe3, 0x0d, 0x2e, 0xf9, 0x0c, 0x8e];
  }
  static _MAX_URI_LENGTH() {
    return 1000;
  }
  static _ALLOWED_URI_CHARS() {
    return 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._/:';
  }

  constructor(uri_) {
    super();
    this.uri = uri_;
  }

  static checkUri(uri) {
    if (uri.length > this._MAX_URI_LENGTH()) {
      console.log('URI exceeds maximum length');
      return false;
    }
    for (let i = 0; i < uri.length; i++) {
      const char = uri[i];
      if (this._ALLOWED_URI_CHARS().indexOf(char) < 0) {
        console.log('URI contains invalid character ');
        return false;
      }
    }
    return true;
  }

  static deserialize(ctxPayload) {
    const utf8Uri = ctxPayload.readVarbytes(this._MAX_URI_LENGTH());
    if (this.checkUri(utf8Uri) === false) {
      console.log('Invalid URI: ');
      return;
    }
    const decode = new Buffer(utf8Uri).toString('ascii');
    return new PendingAttestation(decode);
  }

  serialize(ctx) {
    ctx.writeVarbytes(PendingAttestation._TAG());
    this.serializePayload(ctx);
  }

  serializePayload(ctx) {
    ctx.writeVarbytes(this.uri);
  }
  toString() {
    return 'PendingAttestation(\'' + this.uri + '\')';
  }
}

class BitcoinBlockHeaderAttestation extends TimeAttestation {

  static _TAG() {
    return [0x05, 0x88, 0x96, 0x0d, 0x73, 0xd7, 0x19, 0x01];
  }

  constructor(height_) {
    super();
    this.height = height_;
  }

  static deserialize(ctxPayload) {
    const height = ctxPayload.readVaruint();
    return new BitcoinBlockHeaderAttestation(height);
  }

  serialize(ctx) {
    ctx.writeVarbytes(BitcoinBlockHeaderAttestation._TAG());
    this.serializePayload(ctx);
  }

  serializePayload(ctx) {
    ctx.writeVaruint(this.height);
  }
  toString() {
    return 'BitcoinBlockHeaderAttestation ' + Utils.bytesToHex(BitcoinBlockHeaderAttestation._TAG()) + ' ' + Utils.bytesToHex([this.height]);
  }
}

module.exports = {
  TimeAttestation,
  UnknownAttestation,
  PendingAttestation,
  BitcoinBlockHeaderAttestation
};

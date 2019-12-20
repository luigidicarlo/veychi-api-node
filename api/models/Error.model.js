module.exports = class Err {
  constructor(errObj) {
    this.code = errObj.code;
    this.stack = errObj.stack;
    this.message = errObj.message;
  }
}
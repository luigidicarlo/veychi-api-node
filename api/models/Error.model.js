module.exports = class Err {
  constructor(errObj) {
    this.stack = errObj.stack;
    this.message = errObj.message;
  }
}
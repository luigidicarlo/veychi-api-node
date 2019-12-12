module.exports = class Response {
    constructor(ok = false, data, error) {
        this.ok = ok;
        this.data = data;
        this.error = error;
    }
}
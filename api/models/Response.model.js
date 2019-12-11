module.exports = class Response {
    constructor(ok, data, error) {
        this.ok = ok;
        this.data = data;
        this.error = error;
    }
}
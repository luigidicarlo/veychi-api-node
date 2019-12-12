module.exports = {
    usernames: /^[a-zA-Z0-9_.-]+$/,
    names: /^[a-zA-ZñÑáéíóúÁÉÍÓÚ\' ]+$/,
    emails: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    rut: /^[0-9]+[-|‐]{1}[0-9kK]{1}$/,
    storeNames: /^[$0-9a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\' ]+$/,
    productNames: /^[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ\' -]+$/
};
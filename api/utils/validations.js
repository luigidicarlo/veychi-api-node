const isNotNull = (value) => {
    if (value === null) return Promise.reject('Parent category cannot be null');
};

module.exports = {
    isNotNull
};

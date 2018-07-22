const jwtSecret = process.env.JWTSECRET;

module.exports = {
    jwtSecret: jwtSecret,
    jwtSession: {
        session: false
    }
};
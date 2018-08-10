const db = {};

db.makeDbUri = (dbPrtcl,dbUser,dbPw,dbStr)=>{
    return dbPrtcl + dbUser + ':' + dbPw + dbStr;
};



module.exports = db;
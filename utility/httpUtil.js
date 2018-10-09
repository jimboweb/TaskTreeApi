const uiUrls = ['htto://localhost:8080'];

const addCrossOriginHeaders = (req,res,next) =>{
    uiUrls.forEach(uiUrl=>{
        res.setHeader('Access-Control-Allow-Origin',uiUrl);
    });
    next();
}
const httpUtils = {};
httpUtils.addCrossOriginHeaders = addCrossOriginHeaders;
module.exports = httpUtils;
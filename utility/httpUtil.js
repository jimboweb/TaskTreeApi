const uiUrls = ['http://localhost:8080'];

//TODO 181013: allw the x-access-token hedaer

const addCrossOriginHeaders = (req,res,next) =>{
    uiUrls.forEach(uiUrl=>{
        res.setHeader('Access-Control-Allow-Origin',uiUrl);
        res.setHeader('Access-Control-Allow-Credentials','true')
    });
    next();
}

const corsOptions = {
    origin: ['http://localhost:8080', 'https://reading-insomnia.herokuapp.com/'],
    methods: ['GET','POST','PATCH','PUT','DELETE'],
    allowedHeaders: ['x-access-token'],
    preFlightContinue: true
}

const httpUtils = {};
httpUtils.addCrossOriginHeaders = addCrossOriginHeaders;
httpUtils.corsOptions = corsOptions;
module.exports = httpUtils;
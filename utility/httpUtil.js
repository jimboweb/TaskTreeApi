const uiUrls = ['http://localhost:8080', 'https://reading-insomnia.herokuapp.com'];


const addCrossOriginHeaders = (req,res,next) =>{
    uiUrls.forEach(uiUrl=>{
        res.setHeader('Access-Control-Allow-Origin',uiUrl);
        res.setHeader('Access-Control-Allow-Credentials','true')
    });
    next();
}

const corsOptions = {
    origin: ['http://localhost:8080', 'https://reading-insomnia.herokuapp.com'],
    methods: ['GET','POST','PATCH','PUT','DELETE'],
    allowedHeaders: ['x-access-token', 'Content-Type'],
    preFlightContinue: true
}

const httpUtils = {};
httpUtils.addCrossOriginHeaders = addCrossOriginHeaders;
httpUtils.corsOptions = corsOptions;
module.exports = httpUtils;

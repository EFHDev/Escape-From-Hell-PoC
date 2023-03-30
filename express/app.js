const createError = require('http-errors');
const express = require('express');
const path = require('path');
const { Http2ServerRequest } = require('http2');
const http = require('http');
const utility = require('./../core/util/utility')
const { ResponseController, Routes } = require('./../src/Controllers/ResponseController');
const { TarkovSend }  = require('./../core/server/tarkovSend');
const zlib = require('zlib');
const compression = require('compression');
const fs = require('fs');

const responseClass = require("./../src/functions/response").responses;
const legacyCallbacks = require("./../src/functions/callbacks.js").callbacks

const cookieParser = require('cookie-parser');
const { truncate, fstat } = require('fs');
const { logger } = require('../core/util/logger');

const app = express();



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

app.use(express.raw({ type: "application/json", limit: '50mb',
parameterLimit: 100000,
extended: true  }));
app.use(cookieParser());

app.use(function(req, res, next) {
  const PHPSESSID = req.cookies != undefined && req.cookies["PHPSESSID"] !== undefined ? req.cookies["PHPSESSID"] : undefined;
  var ip = req.header('x-forwarded-for') || req.socket.remoteAddress;
  // console.log(ip);
  // if(ResponseController.RoutesToNotLog.findIndex(x=>x == req.url) === -1)
  //   logger.logInfo(`${ip}::${PHPSESSID}::${req.method}::${req.url}`);

  ResponseController.receivedCall(req, PHPSESSID);

  next();
});

/**
 * 
 * @param {Http.IncomingMessage} req 
 * @param {object} res 
 * @param {function} next if you want to skip to next middleware
 * @param {function} done returns function with request body object parameter
 */
function inflateRequestBody(req, res, next, done) {

  // console.log(req.body);

  const stringifiedBody =
    typeof(req.body) === "object" ? JSON.stringify(req.body) : null;

  if(stringifiedBody == '{}') {
    done(req.body);
    return;
  }

    let isJson = req.body.toString !== undefined 
      && req.body.toString('utf-8').charAt(0) == "{";
 
  if(
    (!isJson || (req.headers["content-encoding"] !== undefined && req.headers["content-encoding"] == "deflate"))
    &&
    ((req.headers["user-agent"] !== undefined && req.headers["user-agent"].includes("Unity"))
    && req.body["toJSON"] !== undefined)
    ) {
    
    try {
      zlib.inflate(req.body, function(err, result) { 

        if(!err && result !== undefined) {

          var asyncInflatedString = result.toString('utf-8');
          // console.log(asyncInflatedString);
          if(asyncInflatedString.length > 0) {
            req.body = JSON.parse(asyncInflatedString);
          }
          done(req.body);
          return;

        }
        else {
          done(req.body);
          return;

        }


      });

    }
    catch (error) { 
      // console.error(error);
      req.body = JSON.parse(req.body);
      done(req.body);
      return;

    }
    // console.log("inflating data...");
    // console.log(req.body);

  }
  else  {
    req.body = JSON.parse(req.body.toString('utf-8'));
    done(req.body);
  }

  // done();

}

app.use(function(req, res, next) {
  inflateRequestBody(req, res, next, () => {
    next();
  });
});

// app.use(express.static(path.join(__dirname, 'public')));

/**
 * 
 * @param {http.IncomingMessage} req 
 * @param {http.OutgoingMessage} res 
 * @param {object} Route 
 */
function handleRoute(req, res, Route) {

  const PHPSESSID = req.cookies != undefined && req.cookies["PHPSESSID"] !== undefined ? req.cookies["PHPSESSID"] : undefined;
  var ip = req.header('x-forwarded-for') || req.socket.remoteAddress;

  if(ResponseController.RoutesToNotLog.findIndex(x=>x == req.url) === -1)
    logger.logInfo(`${ip}::${PHPSESSID}::${req.method}::${req.url}`);

  var routedData = Route(req.url, req.body, PHPSESSID)
  if(routedData != null && routedData != undefined ) {
    // const deflateData = zlib.deflateSync(routedData, {});

        // console.log(routedData);

    let _responseCallbackOccurred = false;
    const responseCallbacks = legacyCallbacks.getRespondCallbacks();
    for(const r in responseCallbacks) {
      if(r === routedData) {
        // console.log(routedData);
        // console.log(r);
        responseCallbacks[r](PHPSESSID, req, res, routedData);
        _responseCallbackOccurred = true;
      }
    }

    if(!_responseCallbackOccurred) {
      if(typeof(routedData) != "string" && typeof(routedData).toString() != "Byte")
      {
        
      }

      zlib.deflate(routedData, (err, deflateData) => {

        // console.log(deflateData);
        if(req.headers["postman-token"] !== undefined)
          res.setHeader("content-encoding", "deflate");

        res.setHeader("content-type", "application/json");

        res.send(deflateData);

      });
    }

   
  }
  else {
    res.send("EXPRESS Tarkov API up and running! ");
  }
}

for(const r of ResponseController.Routes) {
  // console.log(r);
  app.all(r.url, (req, res) => {
    // console.log("ResponseController.Routes:" + r);
    handleRoute(req,res, r.action);

  });
}

for(const r in Routes) {
  app.all(r, (req, res) => {
    
    handleRoute(req,res, Routes[r]);
  
  });
}

for(const r in responseClass.staticResponses) {
  // console.log(r);
  app.all(r, (req, res) => {
  //  logger.logInfo("responseClass.staticResponses:" + r)

    handleRoute(req, res, responseClass.staticResponses[r]);
  });
}

function serveFolder(req, res, next, routeToServe, folderToDirectTo) {
  if(req.url.includes(routeToServe)) {

    let finalFile = req.url.split('/')[req.url.split('/').length-1];
    // console.log(finalFile);
    if(finalFile === "" || finalFile === undefined)
      finalFile = "index.html";
    // const requestedPath = req.url.replace(routeToServe, "").replace(finalFile, "").replace("/", "\\").replace("\/", "\\");
    const docsPath = process.cwd() + req.url.replace(routeToServe, folderToDirectTo).replace(finalFile, "").replace("/", "\\").replace("\/", "\\");
    // console.log(requestedPath);

    // const docsPath = process.cwd() + folderToDirectTo + requestedPath;
    // console.log(docsPath);
    if(!fs.existsSync(docsPath)) {
      res.status(404).send();
      return;
    }

    const files = fs.readdirSync(docsPath);
    // console.log(files);
    
    for(const file of files) {
      // console.log(file);
      if(finalFile.toLowerCase().includes(file.toLowerCase())) {
        let readFile = fs.readFileSync(docsPath + finalFile);

        switch(finalFile.split('.')[finalFile.split('.').length-1]) {
          case "js":
            res.contentType("text/js");
            break;
          case "html":
            res.contentType("text/html");
          break;
          case "css":
            res.contentType("text/css");
            break;
          case "woff":
            res.contentType("font/woff");
            break;
          case "svg":
            res.contentType("Image/svg+xml");
            break;
            
        }
        res.status(200).send(readFile.toString());
        return;
      }
      
    }
    res.status(404).send();
  }
}

/**
 * Add support for JSDoc directory output
 * You can rebuild the docs by running jsdoc src/ -r . in the Terminal
 */
app.use(function(req, res, next) {

  serveFolder(req, res, next, "/docs/", "\\out\\");
  serveFolder(req, res, next, "/out/", "\\out\\");
  serveFolder(req, res, next, "/db/", "\\dbViewer\\");
 
  next();
});

/**
 * Handle "Dynamic" responses (Files, Bundles, Traders etc)
 */
app.use(function(req, res, next) {
  // console.log(req.url);
    
    for(const r in ResponseController.DynamicRoutes) {
    let route = ResponseController.DynamicRoutes[r];
      if (req.url !== "" && req.url.toLowerCase().includes(route.url.toLowerCase())) {
        handleRoute(req, res, route.action);
        return;
      }
    }
    for(const r in responseClass.dynamicResponses) {
      if (req.url.toLowerCase().includes(r.toLowerCase())) {
        handleRoute(req, res, responseClass.dynamicResponses[r]);
        return;
      }
    }
    next();
});


app.use(function(req, res, next) {
  const PHPSESSID = req.cookies != undefined && req.cookies["PHPSESSID"] !== undefined ? req.cookies["PHPSESSID"] : undefined;
  var ip = req.header('x-forwarded-for') || req.socket.remoteAddress;

  if(ResponseController.RoutesToNotLog.findIndex(x=>x == req.url) === -1)
    logger.logError(`${ip}::${PHPSESSID}::${req.method}::${req.url}`);

  next();
});

/**
 * Home Page - NOT USED
 */
app.get('/', (req,res) => {
  res.status(200).send("EXPRESS Tarkov API up and running!");
});

// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// // error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  logger.logError(err);
  console.error(err);
  // render the error page
  res.status(err.status || 500);
  res.render(err);
});

module.exports = app;

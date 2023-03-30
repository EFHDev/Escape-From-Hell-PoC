const fs = require('fs');

class TarkovSend {
    constructor() {
        this.mime = {
            html: "text/html",
            txt: "text/plain",
            jpg: "image/jpeg",
            png: "image/png",
            css: "text/css",
            otf: "font/opentype",
            json: "application/json",
        };
    }

    static mimeTypes = {
        "css": "text/css",
        "bin": "application/octet-stream",
        "html": "text/html",
        "jpg": "image/jpeg",
        "js": "text/javascript",
        "json": "application/json",
        "png": "image/png",
        "svg": "image/svg+xml",
        "txt": "text/plain",
        "json": "application/json",
        "zlib": "application/zlib",
    };

    static zlibJson(resp, output, sessionID, request) {
        let Header = { "Content-Type": TarkovSend.mimeTypes["json"], "Set-Cookie": "PHPSESSID=" + sessionID };
        // let Header = { "Content-Type": TarkovSend.mimeTypes["zlib"], "Set-Cookie": "PHPSESSID=" + sessionID };
        // this should enable content encoding if you ask server from web browser
        // console.log(request);
        if (
            (sessionID === undefined 
            // || request.headers["accept-encoding"] === undefined
            || 
            request.headers["postman-token"] !== undefined
            )
            && output != null
            ) {
            Header["content-encoding"] = "deflate";
            // console.log(resp);
        }
        resp.writeHead(200, "OK", Header);
        internal.zlib.deflate(output, function (err, buf) {
            resp.end(buf);
            return true;
        });

    }

    txtJson(resp, output) {
        resp.writeHead(200, "OK", { "Content-Type": this.mime["json"] });
        resp.end(output);
    }

    html(resp, output) {
        resp.writeHead(200, "OK", { "Content-Type": this.mime["html"] });
        resp.end(output);
    }

    file(resp, file) {
        const _split = file.split(".");
        let type = this.mime[_split[_split.length - 1]] || this.mime["txt"];
        let fileStream = fileIO.createReadStream(file);

        fileStream.on("open", function () {
            resp.setHeader("Content-Type", type);
            fileStream.pipe(resp);
        });
    }

    /**
     * 
     * @param {*} resp 
     * @param {string} file 
     */
    static sendFile(resp, file) {
        // console.log(file);
        const _split = file.split(".");
        let type = TarkovSend.mimeTypes[_split[_split.length - 1]] || TarkovSend.mimeTypes["txt"];
        
        // console.log(process.cwd() + "/" + file);
        // console.log(file);
        // Post 0.12.12.15.17975, it now gets stuff from files not res
        if(file.indexOf("/files/") !== -1 && !fs.existsSync(process.cwd() + "/" + file))
            file = file.replace("/files/", "/res/");

        let fileStream = fs.createReadStream(file);

        fileStream.on("open", function () {
            resp.setHeader("Content-Type", type);
            fileStream.pipe(resp);
        });
    }

    sendStaticFile(req, resp) {
        if (req.url == "/favicon.ico") {
            this.file(resp, "res/icon.ico");
            return true;
        }
        if (req.url.includes(".css")) {
            this.file(resp, "res/style.css");
            return true;
        }
        if (req.url.includes("bender.light.otf")) {
            this.file(resp, "res/bender.light.otf");
            return true;
        }

        if (req.url.includes("/server/config")) {
            //make a different response for static html pages
            // load html page represented by home_f
            //output = router.getResponse(req, body, sessionID);
            //this.tarkovSend.html(resp, output, "");
            return true;
        }
        if (req.url == "/") {
            //home_f.processSaveData(body);
            // its hard to create a file `.js` in folder in windows cause it looks cancerous so we gonna write this code here
            this.html(resp, home_f.RenderHomePage(), "");
            return true;
        }
        return false;
    }
}
module.exports.struct = new TarkovSend();
module.exports.TarkovSend = TarkovSend;
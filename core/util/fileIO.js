"use strict";
const fs = require('fs');
const path = require('node:path');

const writeAtomically = require('write-json-file');

exports.stringify = (data, oneLiner = false) => { return (oneLiner) ? JSON.stringify(data) : JSON.stringify(data, null, "\t"); }

exports.createReadStream = (file) => { return fs.createReadStream(file); }

exports.createWriteStream = (file) => { return fs.createWriteStream(file, { flags: 'w' }); }

exports.readParsed = (file) => { return JSON.parse(fs.readFileSync(file, 'utf8')); }

exports.parse = (string) => { return JSON.parse(string); }

exports.read = (file) => { return fs.readFileSync(file, 'utf8'); }

exports.exist = (file) => { return fs.existsSync(file); }

exports.readDir = (p, recursive = false) => {
    var paths = [];
    if (!fs.existsSync(p)) return paths;

    var items = fs.readdirSync(p);

    for (var i in items) {
        var fullPath = path.join(p, items[i]);
        if (this.lstatSync(fullPath).isDirectory()) {
            if (recursive) {
                var results = this.readDir(fullPath, true).map(x => path.join(items[i], x));
                if (results.length > 0)
                    paths = paths.concat(results);
            }
            else
                paths.push(items[i]);
        }
        else
            paths.push(items[i]);
    }
    return paths.map(x => x.replace(/\\/g, "/").replace(/\/\//g, "/"));
}

exports.statSync = (path) => { return fs.statSync(path); }

exports.lstatSync = (path) => { return fs.lstatSync(path); }

exports.unlink = (path) => { return fs.unlinkSync(path); }

exports.rmDir = (path) => { return fs.rmdirSync(path); }

exports.mkDir = (path) => { return fs.mkdirSync(path); }

function createDir(file) {
    let filePath = file.substr(0, file.lastIndexOf('/'));

    if (!fs.existsSync(filePath)) {
        fs.mkdirSync(filePath, { recursive: true });
    }
}

function _getCaller() {
    try {
        var err = new Error();
        var callerfile;
        var currentfile;

        Error.prepareStackTrace = function (err, stack) { return stack; };

        currentfile = err.stack.shift().getFileName();

        while (err.stack.length) {
            callerfile = err.stack.shift().getFileName();

            if (currentfile !== callerfile) return callerfile;
        }
    } catch (err) { }
    return undefined;
}

exports.write = (file, data, raw = false, atomic = true) => {
    if (file.indexOf('/') != -1)
        createDir(file);
    if (raw) {
        if (atomic) {
            writeAtomically.sync(file, data);
        } else {
            fs.writeFileSync(file, JSON.stringify(data));
        }
        return;
    }
    if (atomic) {
        writeAtomically.sync(file, data, 'utf8');
    } else {
        fs.writeFileSync(file, JSON.stringify(data, null, "\t"), 'utf8');
    }
    return;
}
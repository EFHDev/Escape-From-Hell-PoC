"use strict";
const crypto = require('crypto');

/**
 * 
 * @param {*} target 
 * @returns {*}
 */
function cloneOtherType(target) {
    const constrFun = target.constructor;
    switch (toRawType(target)) {
        case "Boolean":
        case "Number":
        case "String":
        case "Error":
        case "Date":
            return new constrFun(target);
        case "RegExp":
            return cloneReg(target);
        case "Symbol":
            return cloneSymbol(target);
        case "Function":
            return target;
        default:
            return null;
    }
}

function toRawType(value) {
    let _toString = Object.prototype.toString;
    let str = _toString.call(value)
    return str.slice(8, -1)
}

function cloneSymbol(targe) {
    return Object(Symbol.prototype.valueOf.call(targe));
}

function cloneReg(targe) {
    const reFlags = /\w*$/;
    const result = new targe.constructor(targe.source, reFlags.exec(targe));
    result.lastIndex = targe.lastIndex;
    return result;
}

function forEach(array, iteratee) {
    let index = -1;
    const length = array.length;
    while (++index < length) {
        iteratee(array[index], index);
    }
    return array;
}

// core function
exports.DeepCopy = (target, map = new WeakMap()) => {
    // clone primitive types
    if (typeof target != "object" || target == null) {
        return target;
    }

    const type = toRawType(target);
    let cloneTarget = null;

    if (map.get(target)) {
        return map.get(target);
    }
    map.set(target, cloneTarget);

    if (type != "Set" && type != "Map" && type != "Array" && type != "Object") {
        return cloneOtherType(target)
    }

    // clone Set
    if (type == "Set") {
        cloneTarget = new Set();
        target.forEach(value => {
            cloneTarget.add(utility.DeepCopy(value, map));
        });
        return cloneTarget;
    }

    // clone Map
    if (type == "Map") {
        cloneTarget = new Map();
        target.forEach((value, key) => {
            cloneTarget.set(key, utility.DeepCopy(value, map));
        });
        return cloneTarget;
    }

    // clone Array
    if (type == "Array") {
        cloneTarget = new Array();
        forEach(target, (value, index) => {
            cloneTarget[index] = utility.DeepCopy(value, map);
        })
    }

    // clone normal Object
    if (type == "Object") {
        cloneTarget = new Object();
        forEach(Object.keys(target), (key, index) => {
            cloneTarget[key] = utility.DeepCopy(target[key], map);
        })
    }

    return cloneTarget;
}

/* END NEW DEEPCOPY CODE */



exports.valueBetween = (value, minInput, maxInput, minOutput, maxOutput) => {
    return (maxOutput - minOutput) * ((value - minInput) / (maxInput - minInput)) + minOutput
}
// getCookies
exports.getCookies = (req) => {
    let found = {};
    let cookies = req.headers.cookie;
    if (cookies) {
        for (let cookie of cookies.split(';')) {
            let parts = cookie.split('=');

            var partsShift = parts.shift().trim();
            if(partsShift && found[partsShift] === undefined) {
                found[partsShift] = decodeURI(parts.join('='));
            }
        }
    }
    return found;
}
// clearString
exports.clearString = (s) => {
    return s.replace(/[\b]/g, '')
        .replace(/[\f]/g, '')
        .replace(/[\n]/g, '')
        .replace(/[\r]/g, '')
        .replace(/[\t]/g, '')
        .replace(/[\\]/g, '');
}
exports.minusPercent = (n, p) => {
    return n - (n * (p/100));
  }

// getRandomInt
exports.getRandomInt = (min = 0, max = 100) => {
    min = ~~(min);
    max = ~~(max);
    return (max > min) ? ~~(Math.random() * (max - min + 1) + min) : min;
}

/**
 * Used to get percentage between two numbers
 *
 * @param {number} num1 first number input
 * @param {number} num2 second number input
*/
exports.getPercentDiff = (num1, num2) => {
    let raw = (num1 / num2) * 100;
    let diff = raw;
    return diff;
}

/**
 * Used to get percentage difference between two numbers
 *
 * @param {number} num1 first number input (percentage)
 * @param {number} num2 second number input (value to get percentage of)
 */
exports.getPercentOf = (num1, num2) => {
    let percentAsDecimal = num1 / 100
    let percent = percentAsDecimal * num2;
    return percent;
}

// getPercentRandomBool
// true if lucky, false if unlucky
exports.getPercentRandomBool = (percentage) => {
    return ~~((Math.random() * 100) < percentage);
}

// getRandomIntEx
exports.getRandomIntEx = (max) => {
    return (max > 1) ? ~~(Math.random() * (max - 2) + 1) : 1;
}

// getRandomIntEx
exports.getRandomIntInc = (min, max) => {
    min = ~~(min);
    max = ~~(max);
    return ~~(Math.random() * (max - min + 1) + min);
}

const decimalAdjust = require('decimal-adjust')
/**
 * Decimal adjustment of a number.
 *
 * @param {String}  type The type (round, floor, ceil)
 * @param {Number}  value The number
 * @param {Integer} exp The exponent (the 10 logarithm of the adjustment base)
 * 
 * @returns {Number} The adjusted value.
 */
exports.decimalAdjust = (type, value, exp) => {

    if (type == "round") {
        return decimalAdjust('round', value, exp);
    }
    if (type == "floor") {
        return decimalAdjust('floor', value, exp);
    }
    if (type == "ceil") {
        return decimalAdjust('ceil', value, exp);
    }
}

// getDirList TODO: OBSOLETE
exports.getDirList = (path) => {
    return fileIO.readDir(path).filter(function (file) {
        return fileIO.statSync(path + '/' + file).isDirectory();
    });
}
// removeDir TODO: OBSOLETE
exports.removeDir = (dir) => {
    for (file of fileIO.readDir(dir)) {
        let curPath = internal.path.join(dir, file);

        if (fileIO.lstatSync(curPath).isDirectory()) {
            this.removeDir(curPath);
        } else {
            fileIO.unlink(curPath);
        }
    }

    fileIO.rmDir(dir);
}
// getServerUptimeInSeconds
exports.getServerUptimeInSeconds = () => {
    return ~~(internal.process.uptime());
}
// getTimestamp
exports.getTimestamp = () => {
    let time = new Date();
    return ~~(time.getTime() / 1000);
}
// getTime
exports.getTime = () => {
    return this.formatTime(new Date());
}
// formatTime
exports.formatTime = (date) => {
    let hours = ("0" + date.getHours()).substr(-2);
    let minutes = ("0" + date.getMinutes()).substr(-2);
    let seconds = ("0" + date.getSeconds()).substr(-2);
    return hours + "-" + minutes + "-" + seconds;
}
// getDate
exports.getDate = () => {
    return this.formatDate(new Date());
}
// formatDate
exports.formatDate = (date) => {
    let day = ("0" + date.getDate()).substr(-2);
    let month = ("0" + (date.getMonth() + 1)).substr(-2);
    return date.getFullYear() + "-" + month + "-" + day;
}
// makeSign
exports.makeSign = (Length) => {
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;

    for (let i = 0; i < Length; i++) {
        result += characters.charAt(~~(Math.random() * charactersLength));
    }

    return result;
}
// generateNewAccountId
exports.generateNewAccountId = () => {
    return this.generateNewId("AID", 3);
}
// generateNewItemId
exports.generateNewItemId = () => {
    return this.generateNewId("I", 2);
}
// generateNewDialogueId
exports.generateNewDialogueId = () => {
    return this.generateNewId("D", 2);
}

const { v4: uuidv4 } = require('uuid')

// generateNewId
// exports.generateNewId = (prefix = "", useOld = false) => {
//     let getTime = new Date();
//     let retVal = ""
//     if (useOld) {
//         retVal = prefix
//         retVal += getTime.getMonth().toString();
//         retVal += getTime.getDate().toString();
//         retVal += getTime.getHours().toString();
//         retVal += (parseInt(getTime.getMinutes()) + parseInt(getTime.getSeconds())).toString();
//         retVal += this.getRandomInt(1000000, 9999999).toString();
//         retVal += this.makeSign(24 - retVal.length).toString();
//     } else {
//         retVal = `${prefix}-${uuidv4()}`
//     }
//     return retVal;
// }

// exports.mongoIdCounter = 110000000000;
exports.mongoIdCounter = 100001;
exports.randomIdArray = [];

/**
 * DO NOT USE THIS YET!
 */
exports.generateRandomIdArray = () => {

    if(this.randomIdArray.length === 0) {
        // for(let i = 0; i < 4294967295; i++) {
        for(let i = 0; i < 9999999; i++) {
            this.randomIdArray.push(this.generateNewId(undefined, 4));
        }
    }

}

/**
 * 
 * @param {*} prefix 
 * @param {*} version 
 * @returns {string} NewId string
 */
exports.generateNewId = (prefix = "", version = 2) => {
    // if(prefix === "" || prefix === null)
    //     prefix = undefined;

    // let getTime = new Date();
    let retVal = ""
    // switch(version)
    // {
    //     case 1:
    //     {
    //         if(prefix !== undefined)
    //             retVal = prefix

    //         retVal += getTime.getMonth().toString();
    //         retVal += getTime.getDate().toString();
    //         retVal += getTime.getHours().toString();
    //         retVal += (parseInt(getTime.getMinutes()) + parseInt(getTime.getSeconds())).toString();
    //         retVal += this.getRandomInt(1000000, 9999999).toString();
    //         retVal += this.makeSign(24 - retVal.length).toString();
    //         break;
    //     }
    //     case 2:
    //         if(prefix !== undefined)
    //             retVal = `${prefix}-${uuidv4()}`;
    //         else 
    //         retVal = uuidv4();

    //         break;
    //     // close to MongoId but not really
    //     case 3:
    //     {
            // const dateNow = Date.now();
            // const dateNow2 = Date.now() * 2;
            // const objectIdBinary = Buffer.alloc(12);
            // const randomBytes = crypto.randomBytes(5);

            // objectIdBinary[3] = (dateNow >> 4) & 0xff;
            // objectIdBinary[2] = (dateNow >> 8) & 0xff;
            // objectIdBinary[1] = (dateNow >> 16) & 0xff;
            // objectIdBinary[0] = (dateNow >> 24) & 0xff;
            // objectIdBinary[4] = randomBytes[0];
            // objectIdBinary[5] = randomBytes[1];
            // objectIdBinary[6] = randomBytes[2];
            // objectIdBinary[7] = randomBytes[3];
            // objectIdBinary[8] = randomBytes[4];
            // objectIdBinary[9] = (dateNow2 >> 4) & 0xff;
            // objectIdBinary[10] = (dateNow2 >> 8) & 0xff;
            // objectIdBinary[11] = dateNow2 & 0xff;
            // retVal = this.toHexString(objectIdBinary);
            // if(prefix === "AID") {
            //     retVal = prefix + retVal;
            // }
    //         break;
    //     }
    //     // new quicker format - does not allow shoddy prefixes so conforms to MongoID
    //     case 4:
    //     {
        if(this.mongoIdCounter > 999999)
            this.mongoIdCounter = 100000;

        // console.log(Date.now());

        const randomBytes = crypto.randomBytes(6);
        const randomBytes2 = crypto.randomBytes(6);
        // retVal = this.toHexString(randomBytes) + (this.mongoIdCounter++) + this.toHexString(randomBytes2).substring(0, 6)
        retVal = (this.toHexString(randomBytes) + (Date.now())).substring(0, 24)
        // console.log(retVal);
        // console.log(retVal.length);
            // const dateNow = Date.now();
            // let hex = dateNow.toString(16);
            // const dateNow2 = (Date.now() * 2) + (this.mongoIdCounter++)
            // let hex2 = dateNow2.toString(8);

            // let newHex = hex.substring(0, 12) + hex2.split("").reverse().join("").substring(0, 12)
            // retVal = newHex.substring(0, 24);
            if(prefix === "AID") {
                retVal = prefix + retVal;
            }
            // if(prefix === "I") {
            //     retVal = prefix + retVal;
            // }
            // const dateNow = Date.now();
            // const dateNow2 = Date.now() * 2;
            // const dateNow3 = Date.now() * 3;
            // const objectIdBinary = Buffer.alloc(12);
            // objectIdBinary[0] = (dateNow >> 4) & 0xff;
            // objectIdBinary[1] = (dateNow >> 8) & 0xff;
            // objectIdBinary[2] = (dateNow >> 16) & 0xff;
            // objectIdBinary[3] = (dateNow >> 24) & 0xff;
            // objectIdBinary[4] = (dateNow2 >> 24) & 0xff;
            // objectIdBinary[5] = (dateNow2 >> 16) & 0xff;
            // objectIdBinary[6] = (dateNow2 >> 8) & 0xff;
            // objectIdBinary[7] = (dateNow2 >> 4) & 0xff;
            // objectIdBinary[8] = (dateNow3 >> 4) & 0xff;
            // objectIdBinary[9] = (dateNow3 >> 8) & 0xff;
            // objectIdBinary[10] = (dateNow3 >> 16) & 0xff;
            // objectIdBinary[11] = (dateNow3 >> 24) & 0xff;
            // retVal = this.toHexString(objectIdBinary);
    //         break;
    //     }
    //     // Uses the pre-generated array of Ids
    //     case 5:
    //     {
    //         this.generateRandomIdArray();
    //         retVal = this.randomIdArray[Math.floor(Math.random() * (this.randomIdArray.length - 1))]
    //         break;
    //     }
    // }

   

    return retVal;
}

var previousItemIds = [];
var previousItemIdsGenerationTime = Date.now();

exports.generateNewIdQuick = () =>
{


    let new_id = "";
    const first = this.getRandomInt(100000, 999999).toString();
    while(new_id.length < 24) 
    {
        new_id = new_id.concat(this.getRandomInt(100000, 999999).toString());
        new_id = new_id.concat(first.split("").reverse().join(""));
    }
    new_id = new_id.substring(0, 24);
    // if(previousItemIds.findIndex(x=>x === new_id) === -1) {
    //     previousItemIds.push(new_id);
    // }
    // else {
    //     return this.generateNewIdQuick();
    // }
    return new_id;
}

/**
 * 
 * @param {Buffer} byteArray 
 * @returns {*}
 */
exports.toHexString = (byteArray) =>
{
    let hexString = "";
    for (let i = 0; i < byteArray.length; i++)
    {
        hexString += ("0" + (byteArray[i] & 0xFF).toString(16)).slice(-2);
    }
    return hexString;
}

// secondsToTime
exports.secondsToTime = (timestamp) => {
    timestamp = ~~(timestamp);
    let hours = ~~(timestamp / 60 / 60);
    let minutes = ~~((timestamp / 60) - (hours * 60));
    let seconds = timestamp % 60;

    if (minutes < 10) { minutes = "0" + minutes }
    if (seconds < 10) { seconds = "0" + seconds }
    return hours + 'h' + minutes + ':' + seconds;
}
// isUndefined
exports.isUndefined = (dataToCheck) => {
    return typeof dataToCheck == "undefined";
}
exports.getArrayValue = (arr) => {
    return arr[utility.getRandomInt(0, arr.length - 1)];
}

/*
 *	PROFILE UTILITIES
 *
*/

exports.generateInventoryID = (profile) => {
    let itemsByParentHash = {};
    let inventoryItemHash = {};
    let inventoryId = "";

    // Generate inventoryItem list
    for (let item of profile.Inventory.items) {
        inventoryItemHash[item._id] = item;

        if (item._tpl === "55d7217a4bdc2d86028b456d") {
            inventoryId = item._id;
            continue;
        }

        if (!("parentId" in item)) {
            continue;
        }

        if (!(item.parentId in itemsByParentHash)) {
            itemsByParentHash[item.parentId] = [];
        }

        itemsByParentHash[item.parentId].push(item);
    }

    // update inventoryId
    const newInventoryId = utility.generateNewItemId();
    inventoryItemHash[inventoryId]._id = newInventoryId;
    profile.Inventory.equipment = newInventoryId;

    // update inventoryItem id
    if (inventoryId in itemsByParentHash) {
        for (let item of itemsByParentHash[inventoryId]) {
            item.parentId = newInventoryId;
        }
    }

    return profile;
}

exports.splitStack = (item) => {
    if (!("upd" in item) || !("StackObjectsCount" in item.upd)) {
        return [item];
    }

    let maxStack = global._database.items[item._tpl]._props.StackMaxSize;
    let count = item.upd.StackObjectsCount;
    let stacks = [];

    // If the current count is already equal or less than the max
    // then just return the item as is.
    if (count <= maxStack) {
        stacks.push(utility.DeepCopy(item));
        return stacks;
    }

    while (count) {
        let amount = Math.min(count, maxStack);
        let newStack = utility.DeepCopy(item);

        newStack._id = utility.generateNewItemId();
        newStack.upd.StackObjectsCount = amount;
        count -= amount;
        stacks.push(newStack);
    }
    
    return stacks;
}

exports.clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/** 
* This ES6(ECMAScript) function getQueryStringParameters takes url 
* as parmater and returns
* parameters name and value in JSON key value format 
* @parameter {String} url 
* (if url is not passed it takes the current url 
* from window.location.href) 
* 
**/
exports.getQueryStringParameters = url => {

    var query = "";
    if (url){
      if(url.split("?").length>0){
      query = url.split("?")[1];
    }
    }else{
       url = window.location.href;
       query = window.location.search.substring(1);
    }
    return (/^[?#]/.test(query) ? query.slice(1) : query)
    .split('&')
    .reduce((params, param) => 
{
  let [ key, value ] = param.split('=');
  params[key] = value?decodeURIComponent(value.replace(/\+/g, ' ')):'';
  return params;
}, { });
};
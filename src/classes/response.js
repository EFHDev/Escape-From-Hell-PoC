"use strict"
// noBody
module.exports.noBody = (data) => {
    return utility.clearString(fileIO.stringify(data));
}
// getBody
module.exports.getBody = (data, err = 0, errmsg = null) => {
    return fileIO.stringify({ "err": err, "errmsg": errmsg, "data": data }, true);
}
// getUnclearedBody
module.exports.getUnclearedBody = (data, err = 0, errmsg = null) => {
    return fileIO.stringify({ "err": err, "errmsg": errmsg, "data": data });
}
// nullResponse
module.exports.nullResponse = () => {
    return this.getBody(null);
}
// emptyArrayResponse
module.exports.emptyArrayResponse = () => {
    return this.getBody([]);
}
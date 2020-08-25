const uuid = require('uuid');
const uuidB64 = require('uuid-base64');

const generateId = () =>  {
    return uuidB64.encode(uuid.v4()).substring(0, 12);
}

module.exports = { generateId };

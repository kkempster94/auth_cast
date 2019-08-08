const fs = require('fs');

const CACHE_PATH = '.cache';


function getCache() {
    
    const exists = checkExists(CACHE_PATH);
    if (exists) {
        const fileContents = fs.readFileSync(CACHE_PATH, { encoding: 'utf8' });
        return JSON.parse(fileContents);
    } else {
        return {

        };
    }
    
}

function setCache(cache) {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache));
}

function checkExists (filePath) {
    let exists = false;
    try {
        fs.statSync(filePath);
        exists = true;
    } catch (error) {
        
    }

    return exists;
}

module.exports = function Cache () {
    this.get = getCache;
    this.set = setCache;
};
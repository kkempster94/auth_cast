const rimraf = require('rimraf');

function pRimraf (thingToRimRaf) {
    return new Promise(resolve => {
        rimraf(thingToRimRaf, resolve);
    });
}

(async () => {
    await pRimraf('./chrome_user_data');
    await pRimraf('.cache');
    await pRimraf('.local-chromium');
})()


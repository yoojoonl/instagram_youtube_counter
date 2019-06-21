const fs = require('fs');
const date = new Date();
const legibleDate = date.getFullYear().toString(10) + '-'
    + (date.getMonth()+1).toString(10) + '-' + date.getDate().toString(10) + ' '
    + date.getHours().toString(10) + ':' + date.getMinutes().toString(10);
const readline = require('readline');
const {google} = require('googleapis');
const OAuth2 = google.auth.OAuth2;

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/youtube-nodejs-quickstart.json
const SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];
const TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
const TOKEN_PATH = TOKEN_DIR + 'youtube-nodejs-quickstart.json';

// Load client secrets from a local file.
fs.readFile('client_secret.json', function processClientSecrets(err, content) {
    if (err) {
        console.log('Error loading client secret file: ' + err);
        return;
    }
    // Authorize a client with the loaded credentials, then call the YouTube API.
    authorize(JSON.parse(content), helper);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const clientSecret = credentials.installed.client_secret;
    const clientId = credentials.installed.client_id;
    const redirectUrl = credentials.installed.redirect_uris[0];
    const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function(err, token) {
        if (err) {
            getNewToken(oauth2Client, callback);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            callback(oauth2Client);
        }
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', function(code) {
        rl.close();
        oauth2Client.getToken(code, function(err, token) {
            if (err) {
                console.log('Error while trying to retrieve access token', err);
                return;
            }
            oauth2Client.credentials = token;
            storeToken(token);
            callback(oauth2Client);
        });
    });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if (err.code !== 'EEXIST') {
            throw err;
        }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) throw err;
        console.log('Token stored to ' + TOKEN_PATH);
    });
    console.log('Token stored to ' + TOKEN_PATH);
}

async function helper(auth, names){
    let i;
    names = ['tvpowderroom','roommate','shouldnotworksdfasdvasve'];
    for(i = 0;i < names.length;i++){
        await getChannel(auth,names[i]);
    }
    /*
    //Can be preused to set names
    const names1 = ['tvpowderroom','roommate','shouldnotworksdfasdvasve'];
    let i;
    for(i = 0;i < names1.length;i++){
        await getChannel(auth,names1[i]);
    }

    //Used to take input for names
    let names2 =[];
    for(i = 2;i < process.argv.length; i++){
        names2.push(process.argv[i]);
    }
    for (i = 0; i < names2.length; i++) {
        await getChannel(auth,names2[i]);
    }
    */
}

/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */

function getChannel(auth,name) {
    const service = google.youtube('v3');
    return new Promise((resolve, reject) => {
        service.channels.list({
            auth: auth,
            part: 'snippet,contentDetails,statistics',
            maxResults: 1,
            forUsername: name
        }, function (err, response) {
            if (err || (response === undefined)) {
                reject('The API returned an error: ' + err);
                return;
            }
            let channels = response.data.items[0];
            if (channels === undefined) {
                service.search.list({
                    auth: auth,
                    part: 'snippet',
                    maxResults: 1,
                    type: 'channel',
                    q: name
                }, function (err, response) {
                    if (err) {
                        reject('The API returned an error: ' + err);
                        return;
                    }
                    if (response.data.items.length === 0) {
                        reject("No channel found with name: " + name);
                        return;
                    }
                    service.channels.list({
                        auth: auth,
                        part: 'snippet,statistics',
                        maxResults: 1,
                        id: response.data.items[0].id.channelId
                    }, function (err, response) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        channels = response.data.items[0];
                        let msg = write_to_file(channels.snippet.title,
                            channels.statistics.subscriberCount,channels.statistics.viewCount);
                        resolve(msg);
                    });
                });

            } else {
                let msg = write_to_file(channels.snippet.title,
                    channels.statistics.subscriberCount,channels.statistics.viewCount);
                resolve(msg);
            }
        });
    }).then((body) => {
        console.log(body);
    }).catch((error) => {
        console.log('Error: ',error);
    });
}
function write_to_file(title,subscribers,viewCount){
    const fileName = 'youtubeCount/' + title + '.txt';
    const msg = 'The channel is ' + title + ', it has '
        + subscribers + ' subscribers, and it has '
        + viewCount + ' views as of ' + legibleDate + '\n';
    fs.appendFile(fileName, msg, (err) => {
        if(err){
            console.log('Error writing to file: '+ err);
        }
    });
    return(msg);
}










//OLD CODE
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const OAuth2 = google.auth.OAuth2;

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/youtube-nodejs-quickstart.json
const SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];
const TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
const TOKEN_PATH = TOKEN_DIR + 'youtube-nodejs-quickstart.json';

// Load client secrets from a local file.
fs.readFile('client_secret.json', function processClientSecrets(err, content) {
    if (err) {
        console.log('Error loading client secret file: ' + err);
        return;
    }
    // Authorize a client with the loaded credentials, then call the YouTube API.
    authorize(JSON.parse(content), helper);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const clientSecret = credentials.installed.client_secret;
    const clientId = credentials.installed.client_id;
    const redirectUrl = credentials.installed.redirect_uris[0];
    const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function(err, token) {
        if (err) {
            getNewToken(oauth2Client, callback);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            callback(oauth2Client);
        }
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', function(code) {
        rl.close();
        oauth2Client.getToken(code, function(err, token) {
            if (err) {
                console.log('Error while trying to retrieve access token', err);
                return;
            }
            oauth2Client.credentials = token;
            storeToken(token);
            callback(oauth2Client);
        });
    });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if (err.code !== 'EEXIST') {
            throw err;
        }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) throw err;
        console.log('Token stored to ' + TOKEN_PATH);
    });
    console.log('Token stored to ' + TOKEN_PATH);
}

async function helper(auth){
    //Can be preused to set names
    const names1 = ['tvpowderroom','roommate','UCoz3Kpu5lv-ALhR4h9bDvcw','shouldnotwork12332123'];
    let i;
    for(i = 0;i < names1.length;i++){
        await getChannel(auth,names1[i]);
    }

    //Used to take input for names
    let names2 =[];
    for(i = 2;i < process.argv.length; i++){
        names2.push(process.argv[i]);
    }
    for (i = 0; i < names2.length; i++) {
        await getChannel(auth,names2[i]);
    }

}

/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */

function getChannel(auth,name) {
    const service = google.youtube('v3');
    return new Promise((resolve, reject) => {
        service.channels.list({
            auth: auth,
            part: 'snippet,contentDetails,statistics',
            maxResults: 1,
            forUsername: name
        }, function (err, response) {
            if (err) {
                console.log('The API returned an error: ' + err);
                resolve();
                return;
            }
            else if(response === undefined){
                console.log('The API returned an error: ' + err);
                resolve();
                return;
            }
            let channels = response.data.items;
            if (channels.length === 0) {
                service.search.list({
                    auth: auth,
                    part: 'snippet',
                    maxResults: 1,
                    type: 'channel',
                    q: name
                }, function (err, response) {
                    if (err) {
                        reject(err);
                        return;
                        /*
                        console.log('The API returned an error' + err);
                        resolve();
                        return;

                         */
                    }
                    if (response.data.items.length === 0) {
                        reject("No channel found with name: " + name);
                        return;
                        /*
                        console.log("No channel found with name: " + name);
                        resolve();
                        return;

                         */
                    }
                    service.channels.list({
                        auth: auth,
                        part: 'snippet,statistics',
                        maxResults: 1,
                        id: response.data.items[0].id.channelId
                    }, function (err, response) {
                        if (err) {
                            reject(err);
                            return;
                            /*
                            console.log('The API returned an error' + err);
                            resolve();
                            return;
                             */
                        }
                        channels = response.data.items;
                        const date = new Date();
                        const legibleDate = date.getFullYear().toString(10) + '-'
                            + (date.getMonth()+1).toString(10) + '-' + date.getDate().toString(10) + ' '
                            + date.getHours().toString(10) + ':' + date.getMinutes().toString(10);
                        const fs = require('fs');
                        const msg = ('The channel is ' + channels[0].snippet.title + ', it has '
                            + channels[0].statistics.subscriberCount + ' subscribers, and it has '
                            + channels[0].statistics.viewCount + ' views as of ' + legibleDate + '\n');
                        let fileName = 'youtubeCount/' + channels[0].snippet.title + '.txt';
                        fs.appendFile(fileName, msg, (err) => {
                            if(err){
                                console.log('Error writing to file: ' + err);
                            }
                        });
                        console.log(msg);
                        resolve();
                    });
                });

            } else {
                const date = new Date();
                const legibleDate = date.getFullYear().toString(10) + '-'
                    + (date.getMonth()+1).toString(10) + '-' + date.getDate().toString(10) + ' '
                    + date.getHours().toString(10) + ':' + date.getMinutes().toString(10);
                const fs = require('fs');
                const msg = 'The channel is ' + channels[0].snippet.title + ', it has '
                    + number_with_commas(channels[0].statistics.subscriberCount) + ' subscribers, and it has '
                    + number_with_commas(channels[0].statistics.viewCount) + ' views as of ' + legibleDate + '\n';
                let fileName = 'youtubeCount/' + channels[0].snippet.title + '.txt';
                fs.appendFile(fileName, msg, (err) => {
                    if(err){
                        console.log('Error writing to file: ' + err);
                    }
                });
                console.log(msg);
                resolve();
            }
        });
    }).then((body) => {
        console.log(body);
    }).catch((error) => {
        console.log('Error',error);
    });
}

/**
 * Function that adds commas to a number every 3 digits
 * Used from stack overflow https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
 * @param x: A number given to have commas added to it
 * @returns {string}: the number but commas are added to make it more legible
 */
function number_with_commas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
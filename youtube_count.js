/* GLOBAL */
const fs = require('fs');
const moment = require('moment');
const readline = require('readline');
const {google} = require('googleapis');
const service = google.youtube('v3');
const OAuth2 = google.auth.OAuth2;
let names;
let data;
let pictures;
let urls;
// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/youtube-nodejs-quickstart.json
const SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];
const TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
const TOKEN_PATH = TOKEN_DIR + 'youtube-nodejs-quickstart.json';

/**
 * Function that is called from the main file
 *
 * @param input: list of all names to be used
 * @returns {Array[]}: 2d list that contains the lists of data and pictures for each youtube channel in order
 */
exports.youtube_counter = function call(input){
    names = input;
    data = [];
    pictures = [];
    urls = [];
    fs.readFile('client_secret.json', function processClientSecrets(err, content) {
        if (err) {
            console.log('Error loading client secret file: ' + err);
            return;
        }
        // Authorize a client with the loaded credentials, then call the YouTube API.
        authorize(JSON.parse(content), helper);
    });
    return [data, pictures, urls];
};

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

/**
 * Used to call get_channel function and await
 * the response
 *
 * @param auth: an authorized OAuth2 client.
 */
async function helper(auth) {
    if(Array.isArray(names)){
        for(let i = 0; i < names.length; i++){
            await get_channel(auth,names[i]);
        }
    }
    else{
        await get_channel(auth,names);
    }

}

/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 * @param name: the name of the youtube channel being searched
 */
function get_channel(auth, name) {
    return new Promise((resolve, reject) => {
        service.channels.list( {
            auth: auth, part: 'snippet,statistics',
            maxResults: 1, forUsername: name
        }, function (err, response) {
            if (err || (response === undefined)) reject('The API had an error: ' + err);

            else if (response.data.items[0] === undefined) {
                service.search.list( {
                    auth: auth, part: 'snippet',
                    maxResults: 1, type: 'channel', q: name
                }, function (err, response) {
                    if (err) reject('The API had an error: ' + err);

                    else if (response.data.items.length === 0) reject('No channel found with name: ' + name);

                    else {
                        service.channels.list( {
                            auth: auth, part: 'snippet,statistics',
                            maxResults: 1, id: response.data.items[0].id.channelId
                        }, function (err, response) {
                            if (err) reject('Could not write to file' + err);

                            else resolve(response.data.items[0]);
                        });
                    }
                });
            } else resolve(response.data.items[0]);
        });
    }).then((channels) => {
        const msg = write_to_file(channels.snippet.title,
            channels.statistics.subscriberCount, channels.statistics.viewCount);
        data.push(msg);
        pictures.push(channels.snippet.thumbnails.high.url);
        urls.push('https://www.youtube.com/' + channels.snippet.customUrl);
        console.log(msg);
    }).catch((error) => {
        console.log('Error: ',error + '\n');
    });
}

/**
 * Used to write information to a .txt of the name of the channel
 *
 * @param title: the channel name used to make the title of the .txt file
 * @param subscribers: the number of subscribers of the channel
 * @param viewCount: the number of views of the channel
 * @returns {string}: the message being written to the file with name, subscribers, and views
 */
function write_to_file(title,subscribers,viewCount) {
    title = title.replace(' ','_');
    const fileName = 'youtubeCount/' + title + '.txt';
    const msg = title + ' channel has '
        + number_with_commas(subscribers) + ' subscribers, and it has '
        + number_with_commas(viewCount) + ' views as of '
        + moment().format('MMMM D, YYYY HH:mm') + '\n';
    fs.appendFile(fileName, msg, (err) => {
        if(err) console.log('Error writing to file: ' + err + '\n');
    });
    return(msg);
}

/**
 * Function that adds commas to a number every 3 digits if needed
 * Used from stack overflow 'https://stackoverflow.com/questions/2901102/
 * how-to-print-a-number-with-commas-as-thousands-separators-in-javascript'
 * @param x: A number given to have commas added to it
 * @returns {string}: the number but commas are added to make it more legible
 */
function number_with_commas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
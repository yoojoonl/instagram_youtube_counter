/* GLOBAL */
const ic = require('./insta_count');
const yc = require('./youtube_count');
const http = require('http');
let i_data;
let i_pictures;
let y_data;
let y_pictures;
let y_url;


//Write instagram account names here (need exact account names)
let instagram_names = [];

//Write youtube account names here (doesn't need to be exact can search)
let youtube_names = [];
//If you want to add more names call node index.js yJamesCharles iArianaGrande 'yAriana Grande'
//Add the y for a youtube channel and an i for an instagram account, if you need a space add it in quotes

/**
 * Function used to call the instagram and youtube functions synchronously so the data is all retrieved before writing
 *
 * @returns {Promise<void>}: Promise returned
 */
async function helper() {
    const instagram_data = await instagram_call();
    const youtube_data = await youtube_call();

    if((instagram_data === undefined) || (instagram_data.length === 0)){
        i_data = [];
        i_pictures = [];
    } else{
        i_data = instagram_data[0];
        i_pictures = instagram_data[1];
    }

    if((youtube_data === undefined) || (youtube_data.length === 0)){
        y_data = [];
        y_pictures = [];
        y_url = [];
    } else{
        y_data = youtube_data[0];
        y_pictures = youtube_data[1];
        y_url = youtube_data[2];
    }
}

/**
 * Used to call the call function from the insta_count.js file
 *
 * @returns {Promise}: Promise resolve returned
 */
function instagram_call() {
    return new Promise((resolve) => {
        if (instagram_names.length === 0) resolve();

        else resolve(ic.instagram_counter(instagram_names));
    });
}

/**
 * Used to call the call function from the youtube_count.js file
 *
 * @returns {Promise}: Promise resolve returned
 */
function youtube_call() {
    return new Promise((resolve) => {
        if (youtube_names.length === 0) resolve();

        else resolve(yc.youtube_counter(youtube_names));
    });
}

/**
 * Server function that creates the server and writes the content including instagram and youtube account info
 */
function server(port) {
    http.createServer(function (req, site) {
        site.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
        site.write('<div style="float:left; width:48vmin;">');
        if((i_data === undefined) && (y_data === undefined)){
            console.log('Wait for page to finish loading');
            site.write('Wait for page to finish loading!');
            site.end();
        } else{
            for(let j = 0; j < i_data.length; j++){
                let split = i_data[j].split(' ');
                const url = 'https://www.instagram.com/' + split[0];
                site.write('<div style = "height:20vmin; background-color:lightgrey; border:1px solid black; margin-bottom: 1vh;">');
                    site.write('<p style = "display:flex; align-items: center; margin:0px">');
                        site.write('<img src = "' + i_pictures[j][0] + '" style = "width:8.5vmin; height:8.5vmin; margin-left: 1vmin; margin-top:1vmin" alt = "Profile Pic">');
                        site.write('<span>');
                            site.write('<a href = "'+ url + '" style = "font-size:2vmin; margin-left:1vmin;">' + split.shift() + '</a>');
                            site.write('<d style = "font-size:2vmin;"> ' + split.join(' ') +'</d>');
                        site.write('</span>');
                    site.write('</p>');
                    site.write('<p style="margin:0px">');
                    for(let k = 0; k < 5; k++){
                        site.write('<img src = "' + i_pictures[j][k+1] + '" style = "width:8.5vmin; ' +
                            'height:8.5vmin; margin-left:1vmin; margin-top:1vmin" alt = "image">');
                    }
                    site.write('</p>');
                site.write('</div>');
            }
            site.write('</div>');
            site.write('<div style = "float:right; width:48vmin;">');
            for(let j = 0; j < y_data.length; j++){
                let split = y_data[j].split(' ');
                site.write('<div style = "height:10vmin; background-color:lightgrey; border:1px solid black; margin-bottom: .25vh;">');
                    site.write('<p style = "display:flex; align-items: center; margin:0px">');
                        site.write('<img src = "' + y_pictures[j] + '" style = "width:8.5vmin; height:8.5vmin; margin-left:1vmin; margin-top:.75vmin" alt = "Profile Pic">');
                        site.write('<span>');
                            site.write('<a href = "'+ y_url[j] + '" style = "font-size:2vmin; margin-left:1vmin;">' + split.shift() + '</a>');
                            site.write('<d style = "font-size:2vmin;"> ' + split.join(' ') +'</d>');
                        site.write('</span>');
                    site.write('</p>');
                site.write('</div>');
            }
            site.write('</div>');
            site.end();
        }
    }).listen(port);

}

function main(){
    for(let i = 2; i < process.argv.length; i++){
        if((process.argv[i][0]) === 'i' ||(process.argv[i][0] === 'I')){
            instagram_names.push(process.argv[i].substring(1));
        } else if((process.argv[i][0] === 'y') || (process.argv[i][0] === 'Y')){
            youtube_names.push(process.argv[i].substring(1));
        }
    }
    helper();
    let port = 2000;
    server(port);
    console.log('Listening on port ' + port);
    setInterval(function() {
        helper();
    },300000); //Timer in milliseconds that determines how often info is updated
}

main();
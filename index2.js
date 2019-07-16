/* GLOBAL */
const ic = require('./insta_count');
const yc = require('./youtube_count');
const fs = require('fs');
let i_data;
let i_pictures;
let y_data;
let y_pictures;
let y_url;
let data_arr = [[],[],[],[],[]];


//Write instagram account names here (need exact account names)
let instagram_names = [];

//Write youtube account names here (doesn't need to be exact can search)
let youtube_names = [];
//If you want to add more names call node index.js yJamesCharles iArianaGrande 'yAriana Grande'
//Add the y for a youtube channel and an i for an instagram account, if you need a space add it in quotes

/**
 * Takes in a parameter names and generates values for those without updating the others in instagram names
 *
 * @param names
 * @returns {Promise<void>}
 */
async function insta_helper(names){
    const instagram_data = await instagram_call(names);
    if(!((instagram_data === undefined) || (instagram_data.length === 0))) {
        data_arr[0].push(instagram_data[0][0]);
        data_arr[2].push(instagram_data[1][0]);
    }
}

/**
 * Takes in a parameter names and generates values for those without updating the others in youtube names
 *
 * @param names
 * @returns {Promise<void>} promise is ignored
 */
async function youtube_helper(names){
    const youtube_data = await youtube_call(names);
    if(!((youtube_data === undefined) || (youtube_data.length === 0))) {
        data_arr[1].push(youtube_data[0]);
        data_arr[3].push(youtube_data[1]);
        data_arr[4].push(youtube_data[2]);
    }
}

/**
 * Used to update or generate all values of instagram names and youtube names
 *
 * @returns {Promise<void>} promise is ignored
 */
async function helper() {
    const instagram_data = await instagram_call(instagram_names);
    const youtube_data = await youtube_call(youtube_names);
    if((instagram_data === undefined) || (instagram_data.length === 0)){
        i_data = [];
        i_pictures = [];
    } else{
        i_data = instagram_data[0];
        i_pictures = instagram_data[1];
        data_arr[0] = i_data;
        data_arr[2] = i_pictures;
    }

    if((youtube_data === undefined) || (youtube_data.length === 0)){
        y_data = [];
        y_pictures = [];
        y_url = [];
    } else{
        y_data = youtube_data[0];
        y_pictures = youtube_data[1];
        y_url = youtube_data[2];
        data_arr[1] = y_data;
        data_arr[3] = y_pictures;
        data_arr[4] = y_url;
    }
}

/**
 * Used to call the call function from the insta_count.js file
 *
 * @returns {Promise}: Promise resolve returned
 */
function instagram_call(names) {
    return new Promise((resolve) => {
        if (names.length === 0) resolve();

        else resolve(ic.instagram_counter(names));
    });
}

/**
 * Used to call the call function from the youtube_count.js file
 *
 * @returns {Promise}: Promise resolve returned
 */
function youtube_call(names) {
    return new Promise((resolve) => {
        if (names.length === 0) resolve();

        else resolve(yc.youtube_counter(names));
    });
}

/**
 * Server function that responds to requests
 *
 * Input: port, port listened to
 */
function server(port) {
    const express = require('express');
    const bodyParser = require('body-parser');
    const app = express();
    app.use(express.static('public'));
    app.use(bodyParser.urlencoded({ extended: true }));
    app.set('view engine', 'ejs');

    app.get('/', function (req, res) {
        if(data_arr[0][data_arr[0].length - 1] === undefined) {
            data_arr[0].pop();
            data_arr[2].pop();
            instagram_names.pop();
        }

        if(Array.isArray(data_arr[1][data_arr[1].length - 1])) {
            if(data_arr[1][data_arr[1].length - 1].length === 0) {
                data_arr[1].pop();
                data_arr[3].pop();
                data_arr[4].pop();
                youtube_names.pop();
            }
        }
        res.render('index', {data: data_arr, error: null});
    });

    app.all('/igraph', function(req, res){
        let name = req.originalUrl.split('?')[1].split('=')[1];
        const path = process.cwd();
        let buffer;
        try {
            buffer = fs.readFileSync(path + "/instagramCount/"+ name +".txt",'utf8');
        } catch{
            buffer = ['Error Reading Data'];
        }
        let data = buffer.toString();
        res.render('graph', {data:data, type:'i'});
    });

    app.all('/ygraph', function(req, res){
        let name = req.originalUrl.split('?')[1].split('=')[1];
        name = decodeURIComponent(name);
        const path = process.cwd();
        let buffer;
        try {
            buffer = fs.readFileSync(path + "/youtubeCount/"+ name +".txt",'utf8');
        } catch{
            buffer = ['Error Reading Data'];
        }
        let data = buffer.toString();
        res.render('graph', {data:data, type:'y'});
    });

    app.post('/post', function (req, res) {
        if((!(instagram_names.includes(req.body.instagram))) && (req.body.instagram !== undefined)){
            instagram_names.push(req.body.instagram);
            insta_helper([req.body.instagram]);
        }
        if((!(youtube_names.includes(req.body.youtube))) && (req.body.youtube !== undefined)){
            youtube_names.push(req.body.youtube);
            youtube_helper(req.body.youtube);
        }
        setTimeout( function() {
            res.redirect('/');
        },1500);
    });

    app.listen(port, function () {
        console.log('Listening on port ' + port);
    });
}

/**
 * Main function that calls all the processes including reading inputs, calling the server, and calling updates
 */
function main(){
    for(let i = 2; i < process.argv.length; i++){
        if((process.argv[i][0]) === 'i' || (process.argv[i][0] === 'I')){
            instagram_names.push(process.argv[i].substring(1));
        } else if((process.argv[i][0] === 'y') || (process.argv[i][0] === 'Y')){
            youtube_names.push(process.argv[i].substring(1));
        }
    }
    helper();
    server(3700);
    setInterval(function() {
        helper();
    },300*1000); //Timer in milliseconds that determines how often info is updated
}

main();
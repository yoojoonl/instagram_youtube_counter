/* GLOBAL */
const dummy_image = 'https://instagram.fdel1-3.fna.fbcdn.net/vp/ba5775179192223' +
    '26aef251a4edda299/5D7C0DF1/t51.2885-19/44884218_345707102882519_2446' +
    '069589734326272_n.jpg?_nc_ht=instagram.fdel1-3.fna.fbcdn.net';
const fs = require('fs');
const moment = require('moment');
const https = require('https');

/**
 * Used to create calls to instagram and wait for them to finish
 *
 * @param input: takes an array of all the names
 * @returns {Promise<Array[]>}: Returns an array of data and pictures of instagram accounts in order
 */
exports.instagram_counter = async function call(input) {
    let data = [];
    let pictures = [];
    for (let i = 0; i < input.length; i++) {
        await count_followers(input[i],data,pictures);
    }
    return [data,pictures];
};

/**
 * Function that gets the amount of followers of an instagram account
 *
 * @param name: the name of the instagram account
 * @param data: the data array that the follower count is pushed to
 * @param pictures: the picture array that the urls of profile pictures and last 5 posted pics are pushed to
 * @returns {Promise<any | never>}: returns the promise
 */
function count_followers(name,data,pictures) {
    const url = 'https://www.instagram.com/';
    const url2 = '/?__a=1';
    const newUrl = url + name + url2;
    return new Promise((resolve, reject) => {
        https.get(newUrl,res => {
            res.setEncoding("utf8");
            let body = "";
            res.on("data", data => {
                body += data;
            });
            res.on("end", () => {
                if(body.includes('Sorry, this page isn&#39;t available.')){
                    reject('No page with that name: ' + name);
                } else resolve(JSON.parse(body));
            });
        }).on('error',(err) => {
            reject('Error reading info from Instagram:' + err);
        });
    }).then((body) => {
        const msg = body.graphql.user.username + ' follower count is '
            + number_with_commas(body.graphql.user.edge_followed_by.count) + ' at time '
            + moment().format('MMMM D, YYYY HH:mm') + '\n';
        const fileName = 'instagramCount/' + name + '.txt';
        fs.appendFile(fileName, msg, (err) => {
            if (err) console.log('Error writing to file: ', err);
        });
        let temp = [];
        temp.push(body.graphql.user.profile_pic_url_hd);
        for(let i = 0; i < 5; i++){
            if (body.graphql.user.edge_owner_to_timeline_media.edges[i] === undefined){
                temp.push(dummy_image);
            } else{
                temp.push(body.graphql.user.edge_owner_to_timeline_media.edges[i].node.display_url);
            }
        }
        pictures.push(temp);
        /*
        pictures.push(body.graphql.user.profile_pic_url_hd);
        for(let i = 0; i < 5; i++){
            if (body.graphql.user.edge_owner_to_timeline_media.edges[i] === undefined){
                pictures.push(dummy_image);
            } else{
                pictures.push(body.graphql.user.edge_owner_to_timeline_media.edges[i].node.display_url);
            }
        }

         */
        data.push(msg);
        console.log(msg);
    }).catch((error) => {
        console.log('Error: ', error + '\n');
    });
}

/**
 * Function that adds commas to a number every 3 digits
 * Obtained from stack overflow https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
 *
 * @param x: A number given to have commas added to it
 * @returns {string}: the number but commas are added to make it more legible
 */
function number_with_commas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
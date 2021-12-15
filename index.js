/*
1. Schema:

    Product {
        name: string,
        price: number,
        url: string
    }

2. Starting program in dev environment (see in package.json): npm run dev
3. Sample for using Promise: https://www.geeksforgeeks.org/node-js-promise-chaining/
*/

const request = require('request');
const cheerio = require('cheerio');

const URL = "https://www.mediamarkt.hu/";
const URLScheme = "https:";

const getHTMLCode = (url) => {
    return new Promise((resolve, reject) => {
        request(url, function (err, res, body) {
            if (err) {
                return reject (err);
            }
            resolve(body);
        })
    })
}

const extractLaptopCategoryURL = () =>{
    return new Promise((resolve, reject) => {

    })
}


getHTMLCode(URL).then((body) => {
    let $ = cheerio.load(body);
    let laptopCategoryURL = URLScheme + $("ul[class='site-navigation2__child-list'] li[data-tracking-nav='Számítástechnika & Iroda']").
                            find("div[data-nav-level='level 1'] li[data-tracking-nav='Laptop, notebook']").
                            find("div[class='site-navigation2__panel site-navigation2__panel--level-3'] li[data-tracking-nav='Laptop, notebook'] a").
                            attr("href");
    console.log("Category: ", laptopCategoryURL)

    

}).catch((err) => {
    console.log("Error occured while hitting URL.");
    console.log(err);
});


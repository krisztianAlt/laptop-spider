/*
1. Schema:

    Laptop {
        name: string,
        price: number,
        url: string
    }

2. Tipps & infos:
    - Starting program in dev environment (see in package.json): npm run dev
    - Sample for using Promise: https://www.geeksforgeeks.org/node-js-promise-chaining/
    - Promises (recursion): https://newbedev.com/while-loop-with-promises
*/

const request = require('request');
const cheerio = require('cheerio');
const express = require("express");
const app = express();
const favicon = require('serve-favicon');

const MAIN_PAGE_URL = "https://www.mediamarkt.hu";
const URL_SCHEME = "https:";

app.use(express.static("public"));
app.use(favicon(__dirname + '/public/images/favicon.ico'));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/templates/main.html");
});

app.get("/laptops", (req, res) => {
    let laptopDatas = [];
    let categoryPageIsNeeded = true;
    getLaptopData(MAIN_PAGE_URL, laptopDatas, categoryPageIsNeeded).then((laptopDatas) => {
        console.log('Size of laptop data package: ', laptopDatas.length);
        res.status(200);
        res.send(JSON.stringify(laptopDatas));
    }).catch((err) => {
        console.log("Problem occured.");
        console.error(err.message);
        res.status(404);
        res.send({"error": "Sorry, problem occured. Please, try later!"});
    })
});

app.get('*', function(req, res){
    res.status(404);
    res.sendFile(__dirname + "/templates/404.html");
});

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

const getLaptopData = (nextURL, laptopDatas, categoryPageIsNeeded) => 
    getHTMLCode(nextURL).then((pageBody) => {
        let nextPageURL;
        if (categoryPageIsNeeded) {
            try {
                nextPageURL = extractLaptopCategoryURL(pageBody);  
                console.log("Category page is extracted: ", nextPageURL);
                return getLaptopData(nextPageURL, laptopDatas, false);
            } catch (err) {
                throw new Error(err.message);
            }
        } else {
            console.log("Crawling: ", nextURL);
            nextPageURL = extractLaptopDataFromHTMLCode(pageBody, laptopDatas);
            if (nextPageURL === undefined){
                console.log("Crawling is over.");
                return laptopDatas;
            } else {
                nextPageURL = MAIN_PAGE_URL + nextPageURL;
                return getLaptopData(nextPageURL, laptopDatas, false);
            }
        }
    });

function extractLaptopCategoryURL(mainPageBody) {
    let $ = cheerio.load(mainPageBody);
    let laptopCategoryURL = $("ul[class='site-navigation2__child-list'] li[data-tracking-nav='Számítástechnika & Iroda']").
                            find("div[data-nav-level='level 1'] li[data-tracking-nav='Laptop, notebook']").
                            find("div[class='site-navigation2__panel site-navigation2__panel--level-3'] li[data-tracking-nav='Laptop, notebook'] a").
                            attr("href");
    if (laptopCategoryURL === undefined) {
        throw new Error("Category URL is not found.");
    }
    return (URL_SCHEME + laptopCategoryURL);
}

function extractLaptopDataFromHTMLCode(pageBody, laptopDatas) {
    let $ = cheerio.load(pageBody);
    let nextPageURL = $("ul[class='pagination']").first().find("li[class='pagination-next'] a").attr("href");
    
    $("ul[class='products-list'] li div[class='product-wrapper']").each(function(){
        let productName = $(this).find("div[class='content '] h2 a").text().trim();
        let productPrice = $(this).find("aside[class='product-price alt'] div[class='price-box'] div").text().trim();
        if (productPrice.includes("\n")){
            productPrice = productPrice.slice(0, productPrice.indexOf("\n"));
        }
        let productURL = MAIN_PAGE_URL + $(this).find("div[class='content '] h2 a").attr("href");
        
        if (productName.length > 1){
            let laptop = {
                name: productName,
                price: productPrice,
                url: productURL
            }
            laptopDatas.push(laptop);
        }
    });
    return (nextPageURL);
}

app.listen(8080);
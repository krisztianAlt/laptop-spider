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

const express = require("express");
const app = express();
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const spiderModule = require("./spider.js");
const getLaptopData = spiderModule.getLaptopData;
const getLaptopDataViaProxy = spiderModule.getLaptopDataViaProxy;
const checkCrawlingProcess = spiderModule.checkCrawlingProcess;
const MAIN_PAGE_URL = spiderModule.MAIN_PAGE_URL;

var proxyNeeded = false;
const proxyModule = require("./proxy_spider.js");
const getAvailableProxyServer = proxyModule.getAvailableProxyServer;

const port = process.env.PORT || 8080;

app.use(express.static("public"));
app.use(favicon(__dirname + '/public/images/favicon.ico'));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/templates/main.html");
});

app.get("/laptops", (req, res) => {
    let laptopDatas = [];
    let categoryPageIsNeeded = true;
    if (proxyNeeded) {
        getAvailableProxyServer().then((availableProxyServer) => {
            console.log('Available proxy server: ' + availableProxyServer);
            getLaptopDataViaProxy(MAIN_PAGE_URL, availableProxyServer, undefined, laptopDatas, categoryPageIsNeeded).then((response) => {
                console.log(response);
                console.log(response.message + " Process ID: " + response.id);
                res.status(200);
                res.send(JSON.stringify({"processId" : response.id, "message": response.message}));
            }).catch((err) => {
                console.log("Problem occured. We are in index.js.");
                console.error(err);
                res.status(404);
                res.send(JSON.stringify({"error": "Sorry, problem occured. Please, try again or later!"}));
            });
        })
    } else {
        try {
            getLaptopData(MAIN_PAGE_URL, undefined, laptopDatas, categoryPageIsNeeded).then((response) => {
                console.log(response.message + " Process ID: " + response.id);
                res.status(200);
                res.send(JSON.stringify({"processId" : response.id, "message": response.message}));
            }).catch((err) => {
                console.log("Problem occured. We are in index.js.");
                console.error(err);
                res.status(404);
                res.send(JSON.stringify({"error": "Sorry, problem occured. Please, try later!"}));
            });    
        } catch (error) {
            console.log("We are in index.js");
            console.log(error);
            res.status(404);
            res.send(JSON.stringify({"error": "Oh, noooo... Sorry, problem occured. Please, try later!"}));
        }
        
    }

    /*
    // Old version:
    getLaptopData(MAIN_PAGE_URL, laptopDatas, categoryPageIsNeeded).then((laptopDatas) => {
        console.log('Size of laptop data package: ', laptopDatas.length);
        res.status(200);
        res.send(JSON.stringify(laptopDatas));
    }).catch((err) => {
        console.log("Problem occured.");
        console.error(err);
        res.status(404);
        res.send({"error": "Sorry, problem occured. Please, try later!"});
    })
    */
});

app.post("/checking", jsonParser, (req, res) => {
    let crawlingProcessId = req.body.process_id;
    try {
        let responsePackage = checkCrawlingProcess(crawlingProcessId);
        res.send(JSON.stringify(responsePackage));
    } catch (err) {
        console.error(err);
        res.status(404);
        res.send(JSON.stringify({"error": "Sorry, problem occured. Please, try later!"}));
    }
});

app.get('*', function(req, res){
    res.status(404);
    res.sendFile(__dirname + "/templates/404.html");
});

app.listen(port);
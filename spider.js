const request = require('request');
const cheerio = require('cheerio');
const { response } = require('express');

const MAIN_PAGE_URL = "https://www.mediamarkt.hu";
const URL_SCHEME = "https:";

const proxyModule = require("./proxy_spider.js");
const getAvailableProxyServers = proxyModule.getAvailableProxyServers;
var proxyNeeded = false;
var proxyUrl = '';

const crawlingProcesses = [];

const getHTMLCode = (url) => {
    let actualURL;
    if (proxyNeeded) {
        console.log("We are trying with a proxy server: " + proxyUrl);
        actualURL = {url,
                    'method': 'GET',
                    'proxy': proxyUrl};
    } else {
        actualURL = url;
    }

    return new Promise((resolve, reject) => {
        console.log(actualURL);
        request(actualURL, function (err, res, body) {
            if (err) {
                return reject (err);
            }
            console.log(res['statusCode']);
            console.log(proxyNeeded);
            // console.log(Object.keys(res['request']));
            let req = res['request'];
            if (res['statusCode'] == '400' && proxyNeeded != true) {
                console.log('Problem occured. Status code: ');
                console.log(res['statusCode']);                
                console.log(req['headers']);
                console.log(res['body']);
                console.log("We are searching for a proxy server...");
                proxyNeeded = true;
                getAvailableProxyServers().then((response) => {
                    let availableProxyServers = response;
                    console.log("We are in spider.js. Available proxy servers: " + availableProxyServers.length.toString());
                    proxyUrl = availableProxyServers[0];
                    console.log("We are starting getHTMLCode() function again.")
                    return getHTMLCode(url);
                }).catch((err) => {
                    return reject("Proxy servers are not available.");
                });
            } else if (res['statusCode'] == '400' && proxyNeeded == true){
                proxyNeeded = false;
                return reject ("The MediaMarkt server or the proxy server is not available.");
            } else {
                resolve(body);
            }
        })
    })
}

const getLaptopData = (nextURL, processId, laptopDatas, categoryPageIsNeeded) => 
    getHTMLCode(nextURL).then((pageBody) => {
        let nextPageURL;
        if (processId === undefined && categoryPageIsNeeded) {
            let newProcessId = createNewCrawlingProcess(laptopDatas);
            try {
                nextPageURL = extractLaptopCategoryURL(pageBody);  
                console.log("Category page is found: ", nextPageURL);
                getLaptopData(nextPageURL, newProcessId, laptopDatas, false);
                return ({"id": newProcessId, "message": "Laptop category page is found, crawling started."});
            } catch (err) {
                throw new Error(err.message);
            }
        } else {
            let process = getCrawlingProcessById(processId);            
            console.log("Crawling: ", nextURL);
            nextPageURL = extractLaptopDataFromHTMLCode(pageBody, laptopDatas);
            process.finished_pages = process.finished_pages + 1;
            process.laptopDatas = laptopDatas;
            if (nextPageURL === undefined){
                process.status = "finished";
                console.log("Crawling is over.");
                proxyNeeded = false;
                proxyUrl = '';
            } else {
                if (process.status === "started") {
                    process.status = "in progress";
                }
                nextPageURL = MAIN_PAGE_URL + nextPageURL;
                return getLaptopData(nextPageURL, processId, laptopDatas, false);
            }
        }
    });

const getLaptopDataViaProxy = (nextURL, processId, laptopDatas, categoryPageIsNeeded) => 
    getHTMLCodeViaProxy(nextURL).then((pageBody) => {
        let nextPageURL;
        if (processId === undefined && categoryPageIsNeeded) {
            let newProcessId = createNewCrawlingProcess(laptopDatas);
            try {
                nextPageURL = extractLaptopCategoryURL(pageBody);  
                console.log("Category page is found: ", nextPageURL);
                getLaptopDataViaProxy(nextPageURL, newProcessId, laptopDatas, false);
                return ({"id": newProcessId, "message": "Laptop category page is found, crawling started."});
            } catch (err) {
                throw new Error(err.message);
            }
        } else {
            let process = getCrawlingProcessById(processId);            
            console.log("Crawling: ", nextURL);
            nextPageURL = extractLaptopDataFromHTMLCode(pageBody, laptopDatas);
            process.finished_pages = process.finished_pages + 1;
            process.laptopDatas = laptopDatas;
            if (nextPageURL === undefined){
                process.status = "finished";
                console.log("Crawling is over.");
            } else {
                if (process.status === "started") {
                    process.status = "in progress";
                }
                nextPageURL = MAIN_PAGE_URL + nextPageURL;
                return getLaptopDataViaProxy(nextPageURL, processId, laptopDatas, false);
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
    
    // console.log("extractLaptopDataFromHTMLCode function, pageBody variable: " + pageBody);
    // console.log("extractLaptopDataFromHTMLCode function, HTML code: " + $("ul[class='pagination']"));
    
    let nextPageURL = $("ul[class='pagination']").first().find("li[class='pagination-next'] a").attr("href");
    
    // console.log("extractLaptopDataFromHTMLCode function, value of nextPageURL: " + nextPageURL);
    
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

function createNewCrawlingProcess(laptopDatas){
    let id = uuidv4();
    let newProcess = {
        "id": id,
        "status": "started",
        "finished_pages": 0,
        "laptopDatas": laptopDatas
    }
    crawlingProcesses.push(newProcess);
    return id;
}

function getCrawlingProcessById(id){;
    return crawlingProcesses.find(process => process.id === id);
}

function checkCrawlingProcess(processId){
    let process = getCrawlingProcessById(processId);
    if (process.status === "failed") {
        throw new Error("Crawling process failed.");
    } else {
        let response = {
            "processId": process.id,
            "status": process.status,
        }
        if (process.status === "finished"){
            response.message = "Crawling is over.";
            response.laptopDataPackage = process.laptopDatas;
            deleteCrawlingProcessById(processId);
        } else {
            response.message = "The examination of " + process.finished_pages + " pages has been completed.";
        }
        return response;
    }
}

function deleteCrawlingProcessById(processId){
    let indexOfItemToBeDeleted;
    for (let index = 0; index < crawlingProcesses.length; index++){
        if (crawlingProcesses[index].id === processId){
            indexOfItemToBeDeleted = index;
            break;
        }
    }

    if (indexOfItemToBeDeleted === undefined){
        return "Process is not found.";
    }
    
    return crawlingProcesses.splice(indexOfItemToBeDeleted, 1);
}

/*
function testDeleteCrawlingProcessById(){
    let process0 = {"id": "1234qwe", "status": "in progress"};
    let process1 = {"id": "1254qwe", "status": "started"};;
    let process2 = {"id": "1274qwe", "status": "finished"};;
    let process3 = {"id": "1294qwe", "status": "in progress"};;
    crawlingProcesses.push(process0);
    crawlingProcesses.push(process1);
    crawlingProcesses.push(process2);
    crawlingProcesses.push(process3);
    console.log(deleteCrawlingProcessById("6274qwe"));
    console.log(deleteCrawlingProcessById("174qwe"));
    console.log(crawlingProcesses);
}

testDeleteCrawlingProcessById()
*/

function uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0,
        v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

module.exports = {
    getLaptopData,
    checkCrawlingProcess,
    MAIN_PAGE_URL
};

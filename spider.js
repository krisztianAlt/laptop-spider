const request = require('request');
const cheerio = require('cheerio');
const { response } = require('express');

const MAIN_PAGE_URL = "https://www.mediamarkt.hu";
const URL_SCHEME = "https:";

const crawlingProcesses = [];

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
            } else {
                if (process.status === "started") {
                    process.status = "in progress";
                }
                nextPageURL = MAIN_PAGE_URL + nextPageURL;
                return getLaptopData(nextPageURL, processId, laptopDatas, false);
            }
        }
    });

function extractLaptopCategoryURL(mainPageBody) {
    let $ = cheerio.load(mainPageBody);
    let laptopCategoryURL = $("ul[class='site-navigation2__child-list'] li[data-tracking-nav='Sz??m??t??stechnika & Iroda']").
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

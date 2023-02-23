const request = require('request');
const cheerio = require('cheerio');
const { response } = require('express');

const FREE_PROXY_LIST_MAIN_PAGE_URL = "https://free-proxy-list.net/";
const PROXY_URL_SCHEME = "http://";
const SUPPORTED_COUNTRIES = ["United States", "Germany", "France", "United Kingdom", "Netherlands", "South Korea"];

const getHTMLCode = (url) => {
    return new Promise((resolve, reject) => {
        request(url, function (err, res, body) {
            if (err) {
                return reject (err);
            }
            
            if (res['statusCode'] == '400') {
                let req = res['request'];
                console.log('Problem occured. Status code: ');
                console.log(res['statusCode']);                
                console.log(req['headers']);
                console.log(res['body']);
                return reject("At this moment the free-proxy-list.net is not available. Please, try later.");
            } else {
                resolve(body);
            }
        })
    })
}

const getAvailableProxyServer = () => 
    getHTMLCode(FREE_PROXY_LIST_MAIN_PAGE_URL).then((pageBody) => {
        let proxyServers = extractProxyServerDataFromHTMLCode(pageBody);
        if (proxyServers.length > 0) {
            console.log("Available proxy servers: " + proxyServers.length.toString());
            return proxyServers[between(0, proxyServers.length)];
        } else {
            return undefined;
        }
    });

function extractProxyServerDataFromHTMLCode(pageBody) {
    let availableProxyServers = [];
    let $ = cheerio.load(pageBody);
    
    $("table[class='table table-striped table-bordered'] tbody tr").each(function(){
        let serverIpAddress = $(this).find("td:nth-child(1)").text().trim();
        let serverPortNumber = $(this).find("td:nth-child(2)").text().trim();
        let serverCountry = $(this).find("td:nth-child(4)").text().trim();
        let serverAnonymity = $(this).find("td:nth-child(5)").text().trim();
        let serverHTTP = $(this).find("td:nth-child(7)").text().trim();
        
        let proxyURL = PROXY_URL_SCHEME + serverIpAddress.toString() + ':' + serverPortNumber.toString()
        if (serverAnonymity=="anonymous" && serverHTTP=="yes" && SUPPORTED_COUNTRIES.includes(serverCountry)) {
            availableProxyServers.push(proxyURL);
        }
    });
    return availableProxyServers;
}

function between(min, max) {  
    return Math.floor(Math.random() * (max - min) + min);
}

module.exports = {
    getAvailableProxyServer
};
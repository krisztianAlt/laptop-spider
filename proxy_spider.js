const request = require('request');
const cheerio = require('cheerio');
const { response } = require('express');

const FREE_PROXY_LIST_MAIN_PAGE_URL = "https://free-proxy-list.net/";
const WE_WANT_ONLY_ANONYMOUS_SERVERS = true;
const WE_WANT_ONLY_HTTPS_COMPATIBLE_SERVERS = true;
const PROXY_URL_SCHEME = "http://"

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

const getAvailableProxyServers = () => 
    getHTMLCode(FREE_PROXY_LIST_MAIN_PAGE_URL).then((pageBody) => {
        let availableProxyServers = extractProxyServerDataFromHTMLCode(pageBody);
        return availableProxyServers;
    });

function extractProxyServerDataFromHTMLCode(pageBody) {
    let availableProxyServers = [];
    let $ = cheerio.load(pageBody);
    
    $("table[class='table table-striped table-bordered'] tbody tr").each(function(){
        let serverIpAddress = $(this).find("td:nth-child(1)").text().trim();
        let serverPortNumber = $(this).find("td:nth-child(2)").text().trim();
        let serverAnonymity = $(this).find("td:nth-child(5)").text().trim();
        let serverHTTP = $(this).find("td:nth-child(7)").text().trim();
        
        let proxyURL = PROXY_URL_SCHEME + serverIpAddress.toString() + ':' + serverPortNumber.toString()

        if (WE_WANT_ONLY_ANONYMOUS_SERVERS && WE_WANT_ONLY_HTTPS_COMPATIBLE_SERVERS) {
            if (serverAnonymity=="anonymous" && serverHTTP=="yes") {
                availableProxyServers.push(proxyURL);
            }
        } else {
            availableProxyServers.push(proxyURL);
        }
        
    });
    return availableProxyServers;
}

module.exports = {
    getAvailableProxyServers
};
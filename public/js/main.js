const UPARROW = "&#x25B2;";
const DOWNARROW = "&#x25BC;";
var sortingStatus;

function createAnyDOMElement(name, attributes){
    let newElement = document.createElement(name);
    for (let key in attributes){
        newElement.setAttribute(key, attributes[key]);
    }
    return newElement;
};

function showErrorMessage(err){
    let errorMessageContainer = document.querySelector(".error-message-container");
    errorMessageContainer.innerHTML = "";
    let alertDiv = createAnyDOMElement("div", {
        "class": "alert alert-danger alert-dismissible fade show",
        "role": "alert"
    });
    alertDiv.innerText = err;
    let closeButton = createAnyDOMElement("button", {
        "type": "button",
        "class": "btn-close",
        "data-bs-dismiss": "alert",
        "aria-label": "Close"
    });
    alertDiv.appendChild(closeButton);
    errorMessageContainer.appendChild(alertDiv);
}

function showDataInTable(laptopDataPackage){
    let tableBody = document.querySelector(".table-container tbody");
    tableBody.innerHTML = "";

    let sortingInfo = document.querySelector(".table-container p");
    sortingInfo.classList.remove("visually-hidden");
    initSortingStatus();
    laptopDataPackage.sort(compareByName);

    for (let i=0; i<laptopDataPackage.length; i++){
        let row = createAnyDOMElement("tr");
        let nameCell = createAnyDOMElement("td");
        nameCell.innerText = laptopDataPackage[i].name;
        let priceCell = createAnyDOMElement("td", {
            "align": "right"
        });
        priceCell.innerText = formatPrice(laptopDataPackage[i].price) + " Ft";
        row.appendChild(nameCell);
        row.appendChild(priceCell);
        tableBody.appendChild(row);
    }

}

function compareByName(a, b) {
    let nameA = a.name.toUpperCase();
    let nameB = b.name.toUpperCase();
    if (sortingStatus.direction === "asc") {
        if ( nameA < nameB ){
            return -1;
        }
        if ( nameA > nameB ){
            return 1;
        }
    }
    if (sortingStatus.direction === "desc") {
        if ( nameA < nameB ){
            return 1;
        }
        if ( nameA > nameB ){
            return -1;
        }
    }
    return 0;
}

function compareByPrice(a, b) {
    if (sortingStatus.direction === "asc") {
        if ( parseInt(a.price) < parseInt(b.price) ){
            return -1;
        }
        if ( parseInt(a.price) > parseInt(b.price) ){
            return 1;
        }
    }
    if (sortingStatus.direction === "desc") {
        if ( parseInt(a.price) < parseInt(b.price) ){
            return 1;
        }
        if ( parseInt(a.price) > parseInt(b.price) ){
            return -1;
        }
    }
    return 0;
}

function initSortingStatus() {
    sortingStatus = {
        "sortingBy": "name",
        "direction": "asc"
    }
}

function formatPrice(price){
    let formattedPrice = "";
    let digitsInABlockOfThree = 1;
    for (let i = price.length - 1; i>-1; i--) {
        if (digitsInABlockOfThree > 3) {
            formattedPrice = price.charAt(i) + " " + formattedPrice;
            digitsInABlockOfThree = 1;
        } else {
            formattedPrice = price.charAt(i) + formattedPrice;
        }
        digitsInABlockOfThree = digitsInABlockOfThree + 1;
    }
    return formattedPrice;
}

let startScrappingButton = document.querySelector(".button-div button");
startScrappingButton.addEventListener("click", function(ev){
    // ev.preventDefault();
    startScrappingButton.setAttribute("disabled", "disabled");
    let spinner = document.querySelector(".spinner-div");
    spinner.classList.remove("visually-hidden");
    
    let sampleDatas = [{
        name: "MICROSOFT Surface Laptop 4 5PB-00024 Szürke laptop (13,5\" (2256x1504)/Ryzen5/8GB/256 GB SSD/Win10H)",
        price: "4159999",
        url: "https://www.mediamarkt.hu/hu/product/_microsoft-surface-lapt…top-13-5-2256x1504-ryzen5-8gb-256-gb-ssd-win10h-1354709.html"
    },
    {
        name: "MICROSOFT Baszógép",
        price: "315900",
        url: "https://www.mediamarkt.hu/hu/product/_microsoft-surface-lapt…top-13-5-2256x1504-ryzen5-8gb-256-gb-ssd-win10h-1354709.html"
    },
    {
        name: "HP 250 G7 1L3L8EA Ezüst laptop (15,6\" FHD/Core i3/8GB/256 GB SSD/DOS)",
        price: "253259",
        url:"https://www.mediamarkt.hu/hu/product/_hp-250-g7-1l3l8ea-ez%C…BCst-laptop-15-6-fhd-core-i3-8gb-256-gb-ssd-dos-1357828.html"
    }]
    
    showDataInTable(sampleDatas);
    startScrappingButton.removeAttribute("disabled");
    spinner.classList.add("visually-hidden");
    
    /*
    $.ajax({
        url: '/laptops',
        type: 'GET',
        success: function(response) {
            showDataInTable(JSON.parse(response));
        },
        error: function(err) {
            let errorMessage = JSON.parse(err.responseText);
            showErrorMessage(errorMessage.error);
        },
        complete: function() {
            startScrappingButton.removeAttribute("disabled");
            spinner.classList.add("visually-hidden");
        }
    });
    */
})
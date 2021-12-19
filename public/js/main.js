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

function prepareShowingTable(laptopDataPackage) {
    showTableInfoText();
    initSortingStatus();
    laptopDataPackage.sort(compareByName);
    showDataInTable(laptopDataPackage);
    initSortingButtons(laptopDataPackage);
}

function showDataInTable(laptopDataPackage){
    let tableBody = document.querySelector(".table-container tbody");
    tableBody.innerHTML = "";

    for (let i=0; i<laptopDataPackage.length; i++){
        let row = createAnyDOMElement("tr");
        let nameCell = createAnyDOMElement("td");
        nameCell.innerText = laptopDataPackage[i].name;
        let priceCell = createAnyDOMElement("td", {
            "align": "right"
        });
        priceCell.classList.add("price-cell");
        priceCell.innerText = formatPrice(laptopDataPackage[i].price) + " Ft";
        row.appendChild(nameCell);
        row.appendChild(priceCell);
        row.addEventListener("click", function(){
            window.open(laptopDataPackage[i].url);
        });
        tableBody.appendChild(row);
    }

}

function showTableInfoText() {
    let tableInfo = document.querySelectorAll(".table-container p");
    for (let i=0; i<tableInfo.length; i++) {
        tableInfo[i].classList.remove("visually-hidden");
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

function initSortingButtons(laptopDataPackage) {
    let nameArrow = document.querySelector("#name-header-arrow");
    nameArrow.innerHTML = DOWNARROW;
    nameArrow.addEventListener("click", function(){
        if (sortingStatus.sortingBy === "name" && sortingStatus.direction === "asc"){
            nameArrow.innerHTML = UPARROW;
            sortingStatus.direction = "desc";
        } else if (sortingStatus.sortingBy === "name" && sortingStatus.direction === "desc") {
            nameArrow.innerHTML = DOWNARROW;
            sortingStatus.direction = "asc";
        } else if (sortingStatus.sortingBy === "price") {
            priceArrow.innerHTML = DOWNARROW;
            priceArrow.classList.add("inactive");
            nameArrow.classList.remove("inactive");
            sortingStatus.sortingBy = "name"
            sortingStatus.direction = "asc";
        }
        laptopDataPackage.sort(compareByName);
        showDataInTable(laptopDataPackage);
    });

    let priceArrow = document.querySelector("#price-header-arrow");
    priceArrow.classList.add("inactive");
    priceArrow.innerHTML = DOWNARROW;
    priceArrow.addEventListener("click", function(){
        if (sortingStatus.sortingBy === "price" && sortingStatus.direction === "asc"){
            priceArrow.innerHTML = UPARROW;
            sortingStatus.direction = "desc";
        } else if (sortingStatus.sortingBy === "price" && sortingStatus.direction === "desc") {
            priceArrow.innerHTML = DOWNARROW;
            sortingStatus.direction = "asc";
        } else if (sortingStatus.sortingBy === "name") {
            nameArrow.innerHTML = DOWNARROW;
            nameArrow.classList.add("inactive");
            priceArrow.classList.remove("inactive");
            sortingStatus.sortingBy = "price"
            sortingStatus.direction = "asc";
        }
        laptopDataPackage.sort(compareByPrice);
        showDataInTable(laptopDataPackage);
    });
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
    startScrappingButton.setAttribute("disabled", "disabled");
    let spinner = document.querySelector(".spinner-div");
    spinner.classList.remove("visually-hidden");
    
    $.ajax({
        url: '/laptops',
        type: 'GET',
        success: function(response) {
            prepareShowingTable(JSON.parse(response));
        },
        error: function(err) {
            let errorMessage = JSON.parse(err.responseText);
            showErrorMessage(errorMessage.error);
        },
        complete: function() {
            startScrappingButton.removeAttribute("disabled");
            spinner.classList.add("visually-hidden");
        }
    })
})
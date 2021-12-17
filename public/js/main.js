function showErrorMessage(err){
    let errorMessageContainer = document.querySelector(".error-message-container");
    
}

function showDataInTable(laptopDataPackage){
    for (let i=0; i<laptopDataPackage.length; i++){
        console.log(`${i}:`, laptopDataPackage[i]);
    }
}

let startScrappingButton = document.querySelector(".button-div button");
startScrappingButton.addEventListener("click", function(ev){
    // ev.preventDefault();
    startScrappingButton.setAttribute("disabled", "disabled");
    let spinner = document.querySelector(".spinner-div");
    spinner.classList.remove("visually-hidden");
    
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
})
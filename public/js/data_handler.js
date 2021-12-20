var app = app || {};

app.data_handler = {
    startCrawling: function(){
        $.ajax({
            url: '/laptops',
            type: 'GET',
            success: function(response) {
                app.ui.prepareShowingTable(JSON.parse(response));
            },
            error: function(err) {
                let errorMessage = JSON.parse(err.responseText);
                app.ui.showErrorMessage(errorMessage.error);
            },
            complete: function() {
                app.ui.activateStartButton();
                app.ui.hideSpinner();
            }
        })
    }
}
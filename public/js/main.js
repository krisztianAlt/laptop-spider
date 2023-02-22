var app = app || {};

app.init = function() {
    app.ui.initCrawlingButton();
    app.ui.initCrawlingViaProxyButton();
};

$(document).ready(app.init());
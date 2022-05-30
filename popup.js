function render() {
    chrome.tabs.getSelected(null, function (selectedTab) {
        $('#hello').html('The plugin is functioning normally...');
        chrome.runtime.getBackgroundPage(function (backgroundPage) {
            var message = backgroundPage.message;

            if (! message) {
                $('#debug').html('No message do display');
                return;
            }

            $('#debug').html('Last logging message: ' + message);
//          You can even post a message to a backend service
//          $.post("https://www.scs.ubbcluj.ro/plugin/logging.php", message);
        });
    });

    setTimeout(function () {
       window.close();
    }, 3000);

}

$(document).ready(function () {
    render();
});
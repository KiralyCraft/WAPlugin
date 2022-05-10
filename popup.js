function render() {
    chrome.tabs.getSelected(null, function (selectedTab) {
        $("#message").html('Logging...');
        chrome.runtime.getBackgroundPage(function (backgroundPage) {
            var message = backgroundPage.message;
            var key = backgroundPage.key;
            var version = backgroundPage.version;

            if (! message)
                return;

            message.reportTime = (new Date()).getTime();

            message.key = key;
            message.pluginVersion = version;
            console.log(message);
            $.post("https://www.scs.ubbcluj.ro/plugin/logging.php", message);
        });
    });

    setTimeout(function () {
       window.close();
    }, 30000);

}

$(document).ready(function () {
    render();
});
document.addEventListener("DOMContentLoaded", function () {
    const startButton = document.getElementById("startButton");
    const stopButton = document.getElementById("stopButton");
    const downloadLink = document.getElementById("downloadLink");

    let isRunning = false;

    startButton.addEventListener("click", function () {
        isRunning = true;
        startButton.disabled = true;
        stopButton.disabled = false;

        // 启动内容抓取逻辑
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "start" });
        });
    });

    stopButton.addEventListener("click", function () {
        isRunning = false;
        startButton.disabled = false;
        stopButton.disabled = true;

        // 停止内容抓取逻辑
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(
                tabs[0].id,
                { action: "stop" },
                function (response) {
                    if (response.action === "completed") {
                        // 下载抓取的内容
                        chrome.downloads.download({
                            url: response.data,
                            filename: "content.html",
                            saveAs: true,
                        });
                    }
                }
            );
        });
    });
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === "completed") {
        // 下载抓取的内容
        chrome.downloads.download({
            url: message.data,
            filename: "content.html",
            saveAs: true,
        });
    }
});

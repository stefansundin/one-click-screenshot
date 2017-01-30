var canvas = document.createElement("canvas");
var context = canvas.getContext("2d");
var windowId = null;
var tabId = null;

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  // console.log(message, sender);
  if (message.action == "options") {
    windowId = message.windowId;
    tabId = message.tabId;
  }
  else if (message.action == "capture") {
    chrome.tabs.captureVisibleTab(windowId, {
      format: "png"
    }, function(dataUrl) {
      var opts = {
        action: "frame",
        dataUrl: dataUrl,
        x: message.x,
        y: message.y
      };
      // console.log(opts);
      chrome.tabs.sendMessage(tabId, opts, function(response) {
        // console.log("frame response:", response);
      });
    });
  }
  else if (message.action == "abort") {
    var opts = {
      action: "abort"
    };
    chrome.tabs.sendMessage(tabId, opts, function(response) {
      // console.log("abort response:", response);
    });
  }
});

chrome.commands.onCommand.addListener(function(command) {
  if (command == "take-screenshot") {
    chrome.tabs.query({
      currentWindow: true,
      active: true
    }, function(tabs) {
      var tab = tabs[0];

      // If not injected already in this tab, this timeout will run
      var inject = setTimeout(function() {
        chrome.tabs.insertCSS({
          file: "css/inject.css"
        });
        chrome.tabs.executeScript({
          file: "js/content_script.js"
        }, function(ret) {
          console.log(ret);
          if (ret && ret[0] == "injected") {
            windowId = tab.windowId;
            tabId = tab.id;
            var opts = {
              action: "start"
            };
            chrome.tabs.sendMessage(tabId, opts, function(response) {
              // console.log("start response:", response);
            });
          }
          else {
            alert("Error starting screenshot.");
          }
        });
      }, 50);

      // Send a message to the tab to see if the script is already injected
      var opts = {
        action: "check"
      };
      chrome.tabs.sendMessage(tab.id, opts, function(response) {
        if (response == undefined) return;
        console.log("check response", response);
        clearInterval(inject);
        if (response == "running") {
          console.log("already running");
        }
        else {
          windowId = tab.windowId;
          tabId = tab.id;
          var opts = {
            action: "start"
          };
          chrome.tabs.sendMessage(tabId, opts, function(response) {
            // console.log("start response:", response);
          });
        }
      });
    });
  }
});

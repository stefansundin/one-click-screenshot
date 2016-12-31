var version = `v${chrome.runtime.getManifest().version}`;
var capture_started = false;
var tabId = null;

function $() {
  var elements = document.querySelectorAll.apply(document, arguments);
  if (arguments[0][0] == "#") {
    return elements[0];
  } else {
    return elements;
  }
};

document.addEventListener("keydown", function(e) {
  if (e.keyCode == 27) {
    chrome.storage.sync.set({
      autostart: false
    });
    chrome.runtime.sendMessage({
      action: "abort"
    });
  }
  else if (e.keyCode == 13) {
    $("#capture").click();
  }
});

document.addEventListener("DOMContentLoaded", function() {
  $("#extension_version").textContent = version;
  if (navigator.userAgent.indexOf("Firefox/") !== -1) {
    document.body.className += " firefox";
  }
  else {
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
      if (message.action == "goodbye" && $("#autostart").checked == false) {
        window.close();
      }
    });
  }

  chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  }, function(tabs) {
    var tab = tabs[0];
    var title = tab.title.replace(/[:*?"<>|\r\n]/g, "").replace(/[\t \/]+/g, " ").trim();
    $("#filename").value = title + ".png";
    tabId = tab.id;
    chrome.runtime.sendMessage({
      action: "options",
      windowId: tab.windowId,
      tabId: tabId
    });
    var re = tab.url.match(/^chrome(-extension)?:\/\//);
    if (re) {
      $("#capture").disabled = true;
      $("#capture").innerText = `Can't access ${re[0]} urls`;
    }
  });

  if (chrome.storage.sync) {
    chrome.storage.sync.get({
      autostart: false
    }, function(items) {
      if (items.autostart) {
        $("#autostart").checked = true;
        $("#capture").click();
      }
    });
  }

  $("#shortcut").addEventListener("click", function() {
    chrome.tabs.create({url: "chrome://extensions/configureCommands"});
  });

  chrome.commands.getAll(function(commands) {
    commands.forEach(function(command) {
      if (command.name == "take-screenshot") {
        var shortcut = document.getElementById("shortcut");
        shortcut.innerText = command.shortcut || "not set";
      }
    });
  });

  $("#autostart").addEventListener("click", function() {
    chrome.storage.sync.set({
      autostart: this.checked
    });
    if (capture_started) {
      chrome.runtime.sendMessage({
        action: "abort"
      });
      $("#capture").innerText = "Aborted";
    }
  });

  $("#capture").addEventListener("click", function() {
    if (!/\.png$/i.test($("#filename").value)) {
      $("#filename").value += ".png";
    }

    // If not injected already in this tab, this timeout will run
    var inject = setTimeout(function() {
      chrome.tabs.insertCSS({
        file: "css/inject.css"
      });
      chrome.tabs.executeScript({
        file: "js/content_script.js"
      }, function(ret) {
        console.log(ret);
        if (ret[0] == "injected") {
          var opts = {
            action: "start",
            filename: $("#filename").value
          };
          chrome.tabs.sendMessage(tabId, opts, function(response) {
            // console.log("start response:", response);
            capture_started = true;
            $("#filename").disabled = true;
            $("#capture").disabled = true;
            $("#capture").innerText = "Working... please hold";
          });
        }
      });
    }, 50);

    // Send a message to the tab to see if the script is already injected
    var opts = {
      action: "check"
    };
    chrome.tabs.sendMessage(tabId, opts, function(response) {
      if (response == undefined) return;
      console.log("check response", response);
      clearInterval(inject);
      if (response == "running") {
        console.log("already running");
      }
      else {
        var opts = {
          action: "start",
          filename: $("#filename").value
        };
        chrome.tabs.sendMessage(tabId, opts, function(response) {
          // console.log("start response:", response);
          capture_started = true;
          $("#filename").disabled = true;
          $("#capture").disabled = true;
          $("#capture").innerText = "Working... please hold";
        });
      }
    });
  });
});

var version = `v${chrome.runtime.getManifest().version}`;
var running = false;
var tab = null;

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
    // This does not work in Firefox, the popup is just dismissed
    if (chrome.storage.sync) {
      chrome.storage.sync.set({
        autostart: false
      });
    }
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
    // The popup does not close automatically in Firefox when links are clicked
    var links = document.querySelectorAll("a[target='_blank']");
    for (var i=0; i < links.length; i++) {
      links[i].addEventListener("click", function() {
        setTimeout(function() {
          window.close();
        }, 100);
      });
    }
  }
  else {
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
      if (message.action == "goodbye") {
        running = false;
        if ($("#autostart").checked == false) {
          window.close();
        }
        else {
          $("#capture").textContent = "Done";
        }
      }
    });
  }

  chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  }, function(tabs) {
    tab = tabs[0];
    var title = (tab.title || tab.url).replace(/[:*?"<>|\r\n]/g, "").replace(/[\t \/]+/g, " ").trim(); // tab.url fallback is needed for Firefox
    $("#filename").value = title + ".png";
    chrome.runtime.sendMessage({
      action: "options",
      windowId: tab.windowId,
      tabId: tab.id,
    });
    var re = tab.url.match(/^(?:chrome|moz)(?:-extension)?:\/\/|^about:/);
    if (re) {
      $("#capture").disabled = true;
      $("#capture").textContent = `Can't access ${re[0]} urls`;
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
        shortcut.textContent = command.shortcut || "not set";
      }
    });
  });

  $("#autostart").addEventListener("click", function() {
    chrome.storage.sync.set({
      autostart: this.checked
    });
    if (running) {
      chrome.runtime.sendMessage({
        action: "abort"
      });
      $("#capture").textContent = "Aborted";
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
        if (ret && ret[0] == "injected") {
          var opts = {
            action: "start",
            filename: $("#filename").value
          };
          chrome.tabs.sendMessage(tab.id, opts, function(response) {
            // console.log("start response:", response);
            running = true;
            $("#filename").disabled = true;
            $("#capture").disabled = true;
            $("#capture").textContent = "Working... please hold";
          });
        }
        else {
          $("#capture").textContent = "Error injecting script";
          if (navigator.userAgent.indexOf("Chrome/") !== -1 && tab.url.match(/^https:\/\/chrome\.google\.com\//)) {
            $(".injecterror.chrome")[0].style.display = "block";
          }
          else if (navigator.userAgent.indexOf("Firefox/") !== -1 && tab.url.match(/\.mozilla\.org\//)) {
            $(".injecterror.firefox")[0].style.display = "block";
          }
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
        var opts = {
          action: "start",
          filename: $("#filename").value
        };
        chrome.tabs.sendMessage(tab.id, opts, function(response) {
          // console.log("start response:", response);
          running = true;
          $("#filename").disabled = true;
          $("#capture").disabled = true;
          $("#capture").textContent = "Working... please hold";
        });
      }
    });
  });
});

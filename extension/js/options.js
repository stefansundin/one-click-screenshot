var default_options = {
  autostart: false
};
var status_timer = null;

function update_status(text) {
  var status = document.getElementById("status");
  status.textContent = `(${text})`;
  clearTimeout(status_timer);
  status_timer = setTimeout(function() {
    status.textContent = "";
  }, 1000);
};

document.addEventListener("DOMContentLoaded", function() {
  var autostart_input = document.getElementById("autostart");
  var shortcut_button = document.getElementById("shortcut");
  var reset_button = document.getElementById("reset");
  chrome.storage.sync.get(default_options, function(items) {
    autostart_input.checked = items.autostart;
  });

  autostart_input.addEventListener("change", function() {
    var new_options = {
      autostart: autostart_input.checked
    };
    chrome.storage.sync.set(new_options, function() {
      update_status("saved");
    });
  });

  shortcut_button.addEventListener("click", function() {
    chrome.tabs.update(null, {url: "chrome://extensions/configureCommands"});
  });

  reset_button.addEventListener("click", function() {
    chrome.storage.sync.clear(function() {
      update_status("Options reset.");
      autostart_input.checked = default_options.autostart;
    });
  });

  chrome.commands.getAll(function(commands) {
    commands.forEach(function(command) {
      if (command.name == "take-screenshot") {
        shortcut_button.textContent = command.shortcut || "not set";
      }
    });
  });
});

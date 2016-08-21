default_options = {
  saveAs: false
  autostart: false
}

status_timer = null
update_status = (text) ->
  status = document.getElementById("status")
  status.textContent = text
  clearTimeout status_timer
  status_timer = setTimeout ->
    status.textContent = ""
  , 5000

document.addEventListener "DOMContentLoaded", ->
  saveAs_input = document.getElementById("saveAs")
  autostart_input = document.getElementById("autostart")
  save_button = document.getElementById("save")
  reset_button = document.getElementById("reset")

  chrome.storage.sync.get default_options, (items) ->
    saveAs_input.checked = items.saveAs
    autostart_input.checked = items.autostart

  save_button.addEventListener "click", ->
    new_options = {
      saveAs: saveAs_input.checked
      autostart: autostart_input.checked
    }
    chrome.storage.sync.set new_options, ->
      update_status "Options saved."

  reset_button.addEventListener "click", ->
    chrome.storage.sync.clear ->
      update_status "Options reset."
      saveAs_input.checked = default_options.saveAs
      autostart_input.checked = default_options.autostart

version = "v#{chrome.runtime.getManifest().version}"
capture_started = false

$ = ->
  elements = document.querySelectorAll.apply(document, arguments)
  if arguments[0][0] == "#"
    elements[0]
  else
    elements

document.addEventListener "keydown", (e) ->
  # abort and clear autostart on escape key
  if e.keyCode == 27
    chrome.storage.sync.set {
      autostart: false
    }
    chrome.runtime.sendMessage {
      action: "abort"
    }

document.addEventListener "DOMContentLoaded", ->
  $("#extension_version").textContent = version

  chrome.runtime.onMessage.addListener (message, sender, sendResponse) ->
    if message.action == "goodbye" && $("#autostart").checked == false
      window.close()

  chrome.tabs.query { active: true, lastFocusedWindow: true }, (tabs) ->
    tab = tabs[0]
    title = tab.title.replace(/[:*?"<>|\r\n]/g, "").replace(/[\t /]+/g, " ").trim()
    $("#filename").value = title + ".png"
    chrome.runtime.sendMessage {
      action: "options"
      windowId: tab.windowId
    }

  chrome.storage.sync.get {
    saveAs: false
    autostart: false
  }, (items) ->
    $("#saveAs").checked = items.saveAs
    if items.autostart
      $("#autostart").checked = true
      $("#capture").click()

  $("#saveAs").addEventListener "click", ->
    chrome.storage.sync.set {
      saveAs: this.checked
    }
    chrome.runtime.sendMessage {
      action: "options"
      saveAs: this.checked
    }

  $("#autostart").addEventListener "click", ->
    chrome.storage.sync.set {
      autostart: this.checked
    }
    if capture_started
      chrome.runtime.sendMessage {
        action: "abort"
      }
      $("#capture").innerHTML = "Aborted"

  $("#capture").addEventListener "click", ->
    if !/\.png$/i.test($("#filename").value)
      $("#filename").value += ".png"
    chrome.runtime.sendMessage {
      action: "options"
      filename: $("#filename").value
      saveAs: $("#saveAs").checked
    }
    chrome.tabs.insertCSS {
      file: "css/inject.css"
    }
    chrome.tabs.executeScript {
      file: "js/content_script.js"
    } , (ret) ->
      if ret[0] == "injected"
        capture_started = true
        $("#filename").disabled = true
        $("#capture").disabled = true
        $("#capture").innerHTML = "Working... please hold"

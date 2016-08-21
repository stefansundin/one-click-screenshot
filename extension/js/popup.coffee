version = "v#{chrome.runtime.getManifest().version}"

$ = ->
  elements = document.querySelectorAll.apply(document, arguments)
  if arguments[0][0] == "#"
    elements[0]
  else
    elements

document.addEventListener "DOMContentLoaded", ->
  $("#extension_version").textContent = version

  chrome.runtime.onMessage.addListener (message, sender, sendResponse) ->
    if message.action == "goodbye"
      window.close()

  chrome.tabs.query { active: true, lastFocusedWindow: true }, (tabs) ->
    tab = tabs[0]
    title = tab.title.replace(/[:*?"<>|\r\n]/g, "").replace(/[\t /]+/g, " ").trim();
    $("#filename").value = title + ".png"
    chrome.runtime.sendMessage {
      action: "options"
      windowId: tab.windowId
    }

  $("#capture").addEventListener "click", ->
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
        $("#capture").disabled = true
        $("#capture").innerHTML = "Working... please hold"

canvas = document.createElement("canvas")
context = canvas.getContext("2d")
options = {
  filename: "website.png"
  saveAs: false
  windowId: null
}
aborted = false

chrome.runtime.onMessage.addListener (message, sender, sendResponse) ->
  # console.log "message", message, sender
  if message.action == "options"
    options.filename = message.filename if message.filename != undefined
    options.saveAs = message.saveAs if message.saveAs != undefined
    options.windowId = message.windowId if message.windowId != undefined
  else if message.action == "start"
    canvas.width = message.width
    canvas.height = message.height
    aborted = false
  else if message.action == "capture"
    chrome.tabs.captureVisibleTab options.windowId, {
      format: "png"
    }, (data) ->
      # chrome.downloads.download {
      #   url: data
      #   filename: "frame.png"
      # }
      img = new Image
      img.onload = ->
        context.drawImage(this, message.x, message.y)
      img.src = data
    sendResponse(aborted)
  else if message.action == "goodbye"
    opts = {
      url: context.canvas.toDataURL()
      saveAs: options.saveAs
    }
    if options.filename
      opts.filename = options.filename
    else
      opts.saveAs = true

    if navigator.userAgent.indexOf("Firefox/") != -1
      # can't figure out how to save data uri with chrome.downloads in Firefox 48
      opts.action = "download"
      chrome.runtime.sendMessage opts
    else
      chrome.downloads.download opts
  else if message.action == "abort"
    aborted = true
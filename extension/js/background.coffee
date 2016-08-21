canvas = document.createElement("canvas")
context = canvas.getContext("2d")
options = {
  filename: "website.png"
  saveAs: false
  windowId: null
}

chrome.runtime.onMessage.addListener (message, sender, sendResponse) ->
  # console.log "message", message, sender
  if message.action == "options"
    options.filename = message.filename if message.filename
    options.saveAs = message.saveAs if message.saveAs
    options.windowId = message.windowId if message.windowId
  else if message.action == "start"
    canvas.width = message.width
    canvas.height = message.height
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
    sendResponse()
  else if message.action == "goodbye"
    opts = {
      url: context.canvas.toDataURL()
      saveAs: options.saveAs
    }
    if options.filename
      opts.filename = options.filename
    else
      opts.saveAs = true
    chrome.downloads.download opts

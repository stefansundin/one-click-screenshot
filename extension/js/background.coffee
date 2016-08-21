canvas = document.createElement("canvas")
context = canvas.getContext("2d")
filename = "website.png"
windowId = null

chrome.runtime.onMessage.addListener (message, sender, sendResponse) ->
  # console.log "message", message, sender
  if message.action == "filename"
    filename = message.filename
  else if message.action == "windowId"
    windowId = message.windowId
  else if message.action == "start"
    canvas.width = message.width
    canvas.height = message.height
  else if message.action == "capture"
    chrome.tabs.captureVisibleTab windowId, {
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
    chrome.downloads.download {
      url: context.canvas.toDataURL()
      filename: filename
    }

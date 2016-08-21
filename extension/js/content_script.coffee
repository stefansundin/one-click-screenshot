(->
  initialPosition = {
    x: document.scrollingElement.scrollLeft
    y: document.scrollingElement.scrollTop
  }

  measureScrollbar = ->
    if document.body.scrollHeight < window.innerHeight
      # No scrollbar
      return 0
    scrollDiv = document.createElement("div")
    scrollDiv.className = "ocs-scrollbar-measure"
    document.body.appendChild(scrollDiv)
    scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth
    document.body.removeChild(scrollDiv)
    return scrollbarWidth

  capture_callback = (aborted) ->
    if aborted
      window.scrollTo initialPosition.x, initialPosition.y
      return
    setTimeout capture_next, 50

  capture_next = ->
    x = document.scrollingElement.scrollLeft
    y = document.scrollingElement.scrollTop
    scrollHeight = document.scrollingElement.scrollHeight
    width = window.innerWidth
    height = window.innerHeight
    # console.log(x, y, width,height, scrollHeight)
    if y+height < scrollHeight
      y += height
      if y > scrollHeight-height
        y = scrollHeight-height
      window.scrollTo x, y
      chrome.runtime.sendMessage {
        action: "capture"
        x: x
        y: y
      }, capture_callback
    else
      setTimeout ->
        window.scrollTo initialPosition.x, initialPosition.y
        chrome.runtime.sendMessage {
          action: "goodbye"
        }
      , 50

  chrome.runtime.sendMessage {
    action: "start"
    width: window.innerWidth-measureScrollbar()
    height: document.scrollingElement.scrollHeight
  }
  window.scrollTo 0, 0
  setTimeout ->
    chrome.runtime.sendMessage {
      action: "capture"
      x: 0
      y: 0
    }, capture_callback
  , 50

  return "injected"
)()

(->
  initialPosition = [document.scrollingElement.scrollLeft, document.scrollingElement.scrollTop]

  callback = ->
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
      setTimeout ->
        chrome.runtime.sendMessage {
          action: "capture"
          x: x
          y: y
        }, -> setTimeout(callback, 100)
      , 100
    else
      window.scrollTo initialPosition[0], initialPosition[1]
      setTimeout ->
        chrome.runtime.sendMessage {
          action: "goodbye"
        }
      , 100

  chrome.runtime.sendMessage {
    action: "start"
    width: window.innerWidth
    height: document.scrollingElement.scrollHeight
  }
  window.scrollTo 0, 0
  setTimeout ->
    chrome.runtime.sendMessage {
      action: "capture"
      x: 0
      y: 0
    }, -> setTimeout(callback, 100)
  , 100

  return "injected"
)()

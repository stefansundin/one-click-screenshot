(function() {
  var canvas = document.createElement("canvas");
  var context = canvas.getContext("2d");
  var initial_position = {};
  var filename = (document.title || document.location.toString()).replace(/[:*?"<>|\r\n]/g, "").replace(/[\t \/]+/g, " ").trim() + ".png";
  var running = false;
  var aborted = false;

  function measureScrollbar() {
    if (document.body.scrollHeight < window.innerHeight) {
      // No scrollbar
      return 0;
    }
    var scrollDiv = document.createElement("div");
    scrollDiv.className = "ocs-scrollbar-measure";
    document.body.appendChild(scrollDiv);
    var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
    if (scrollbarWidth == 0) {
      // Firefox seems to have problems with this, so in this case just guess that the scrollbar is 15 pixels wide
      scrollbarWidth = 15;
    }
    document.body.removeChild(scrollDiv);
    return scrollbarWidth;
  }

  document.addEventListener("keydown", function(e) {
    // Abort on escape key
    if (e.keyCode == 27) {
      aborted = true;
    }
  });

  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    // console.log(message, sender);
    if (message.action == "check") {
      // Check to prevent injecting twice
      sendResponse(!aborted && running ? "running" : "injected");
    }
    else if (message.action == "start") {
      aborted = false;
      running = true;
      initial_position = {
        x: document.scrollingElement.scrollLeft,
        y: document.scrollingElement.scrollTop
      };
      if (message.filename) {
        filename = message.filename;
      }
      canvas.width = (window.innerWidth - measureScrollbar());
      canvas.height = document.scrollingElement.scrollHeight;
      window.scrollTo(0, 0);
      setTimeout(function() {
        chrome.runtime.sendMessage({
          action: "capture",
          x: 0,
          y: 0
        }, function(response) {
          // console.log("capture1 response:", response);
        });
      }, 150);
      sendResponse("starting...");
    }
    else if (message.action == "frame") {
      if (aborted) return;
      // Draw the new frame on the canvas
      var img = new Image;
      img.onload = function() {
        context.drawImage(this, message.x, message.y);
      };
      img.src = message.dataUrl;

      var x = document.scrollingElement.scrollLeft;
      var y = document.scrollingElement.scrollTop;
      var scrollHeight = document.scrollingElement.scrollHeight;
      var width = window.innerWidth;
      var height = window.innerHeight;
      if (y+height < scrollHeight) {
        // Subtract 20 pixels to avoid getting the horizontal scrollbar repeatedly
        y += height - 20;
        if (y > scrollHeight - height) {
          y = scrollHeight - height;
        }
        window.scrollTo(x, y);
        setTimeout(function() {
          chrome.runtime.sendMessage({
            action: "capture",
            x: x,
            y: y
          }, function(response) {
            // console.log("capture2 response:", response);
          });
        }, 50);
      }
      else {
        // We're done, download the canvas
        // Wait until canvas has been updated
        setTimeout(function() {
          window.scrollTo(initial_position.x, initial_position.y);
          running = false;
          chrome.runtime.sendMessage({
            action: "goodbye"
          });
          context.canvas.toBlob(function(blob) {
            if (blob == null) {
              alert("Sorry, toBlob() returned null. The screenshot you are trying to take is probably too large.\n\nReport your dissatisfaction here:\nhttps://github.com/stefansundin/one-click-screenshot/issues/5");
              return;
            }
            // console.log("blob", blob);
            var url = window.URL.createObjectURL(blob);
            var a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(function() {
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
            }, 100);
          });
        }, 500);
      }
    }
    else if (message.action == "abort") {
      aborted = true;
    }
  });
  return "injected";
})();

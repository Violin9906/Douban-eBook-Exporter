let isCapturing = false;
let capturedContent = [];
let finished = false;
let paragraphIndex = "";

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "start") {
    isCapturing = true;
    capturedContent = [];
    captureContent();
  } else if (message.action === "stop") {
    isCapturing = false;
    sendResponse({
      action: "completed",
      data: createDownloadableHtml(capturedContent),
    });
  }
});

function nextPage() {
  const event = new KeyboardEvent("keydown", {
    key: "ArrowRight",
    keyCode: 39,
    which: 39,
    code: "ArrowRight",
  });

  document.dispatchEvent(event);
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function processContent() {
  const content = document.querySelectorAll(".curr-page .bd .content"); // 使用正确的CSS选择器
  const contentParagraphs = content[0].childNodes;
  // console.log(content[0]);
  const contentElements = [];
  contentParagraphs.forEach(function (paragraph) {
    if (paragraph.nodeName === "P") {
      if (paragraph.attributes['data-pid'].value === paragraphIndex) {
        return; // 分页导致的重复显示，跳过
      }
      paragraphIndex = paragraph.attributes['data-pid'].value;
      const newParagraph = document.createElement("p");
      paragraph.classList.forEach(function (className) {
        newParagraph.classList.add(className);
      });
      paragraph.childNodes.forEach(function (node) {
        if (node.nodeName === "DFN") {
          node.childNodes.forEach(function (childNode) {
            if (childNode.nodeName === "SPAN") {
              newParagraph.innerHTML += childNode.innerHTML;
            } else if (childNode.nodeName === "EM") {
              newParagraph.innerHTML += "<em>" + escapeHtml(childNode.innerText) + "</em>";
            } else if (childNode.nodeName === "I") {
              newParagraph.innerHTML += "<i>" + escapeHtml(childNode.innerText) + "</i>";
            } else if (childNode.nodeName === "WBR") {
            } else if (childNode.nodeName === "SUP") {
              newParagraph.innerHTML +=
                "<sup>" + escapeHtml(childNode.innerText) + "</sup>";
            } else if (childNode.nodeName === "SUB") {
              newParagraph.innerHTML +=
                "<sub>" + escapeHtml(childNode.innerText) + "</sub>";
            } else {
              console.warn(
                "Failed to convert" +
                  childNode.nodeName +
                  ":" +
                  childNode.innerText
              );
              console.warn(childNode);
            }
          });
        } else if (node.nodeName === "CODE") {
          newParagraph.innerHTML +=
            "<pre><code>" + escapeHtml(node.innerText) + "</code></pre>";
        } else if (node.nodeName === "SPAN") {
          newParagraph.innerHTML += node.innerHTML;
        } else if (node.nodeName === "#text") {
        } else if (
          node.nodeName === "DIV" &&
          node.innerText.includes("全文完")
        ) {
          finished = true;
        } else {
          console.warn(
            "Failed to convert" + node.nodeName + ":" + node.innerText
          );
          console.warn(node);
        }
      });
      contentElements.push(newParagraph);
    } else {
      console.warn("Failed to convert:");
      console.warn(paragraph);
    }
  });
  // console.log(contentElements);
  return contentElements;
}

function captureContent() {
  if (!isCapturing) return;

  capturedContent = capturedContent.concat(processContent());
  // console.log(capturedContent)

  if (finished) {
    isCapturing = false;
    chrome.runtime.sendMessage({
      action: "completed",
      data: createDownloadableHtml(capturedContent),
    });
    return;
  }

  setTimeout(captureContent, 250);
  nextPage();
}

function createDownloadableHtml(contentArray) {
  // console.log(contentArray)
  const htmlString = contentArray
    .map(function (element) {
      return element.outerHTML;
    })
    .join("");
  const blob = new Blob([htmlString], { type: "text/html" });
  return URL.createObjectURL(blob);
}

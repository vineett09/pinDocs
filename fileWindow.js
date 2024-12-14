let currentWindowId = null;

// Close button functionality
document.getElementById("close-button").addEventListener("click", () => {
  if (currentWindowId) {
    window.electronAPI.closeWindow(currentWindowId);
  }
});

// Listen for file rendering events
window.electronAPI.renderFile(
  (event, { fileContent, fileExtension, windowId }) => {
    currentWindowId = windowId;
    const contentDiv = document.getElementById("file-content");

    if (fileExtension === ".pdf") {
      contentDiv.innerHTML = `
        <iframe 
            src="${fileContent}" 
            style="width:100%; height:100%; border:none;"
            allowfullscreen
        ></iframe>
      `;
    } else if ([".jpg", ".png", ".gif"].includes(fileExtension)) {
      const img = new Image();
      img.onload = function () {
        contentDiv.innerHTML = "";
        contentDiv.appendChild(img);
      };
      img.src = fileContent;
    } else if (fileExtension === ".txt") {
      contentDiv.innerHTML = `<pre style="margin:0; white-space:pre-wrap; word-wrap:break-word;">${fileContent}</pre>`;
    } else {
      contentDiv.innerHTML = "<h1>Unsupported file type</h1>";
    }
  }
);

// Handle opacity slider
const slider = document.getElementById("opacity-slider");
slider.addEventListener("input", (event) => {
  const value = event.target.value;
  if (currentWindowId) {
    window.electronAPI.adjustOpacity(currentWindowId, value);
  }
});

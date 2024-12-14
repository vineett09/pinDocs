let currentWindowId = null;

// Close button functionality
document.getElementById("close-button").addEventListener("click", () => {
  if (currentWindowId) {
    window.electronAPI.closeWindow(currentWindowId);
  }
});

// Listen for file rendering events
window.electronAPI.renderFile((event, { windowId }) => {
  currentWindowId = windowId;
});

// Handle opacity slider
const slider = document.getElementById("opacity-slider");
slider.addEventListener("input", (event) => {
  const value = event.target.value;
  if (currentWindowId) {
    window.electronAPI.adjustOpacity(currentWindowId, value);
  }
});

document.getElementById("open-file").addEventListener("click", () => {
  window.electronAPI.openFile();
});

document.getElementById("add-note").addEventListener("click", () => {
  window.electronAPI.addNote();
});

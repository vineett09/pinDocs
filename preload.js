const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electronAPI", {
  openFile: () => ipcRenderer.invoke("open-file"),
  addNote: () => ipcRenderer.invoke("add-note"),
  selectApp: () => ipcRenderer.invoke("select-app"),
  adjustOpacity: (windowId, value) =>
    ipcRenderer.send("adjustOpacity", { windowId, value }),
  renderFile: (callback) => {
    ipcRenderer.on("render-file", callback);
    // Return a function to remove the listener when it's no longer needed
    return () => ipcRenderer.removeListener("render-file", callback);
  },
  closeWindow: (windowId) =>
    ipcRenderer.send("close-specific-window", windowId),
});

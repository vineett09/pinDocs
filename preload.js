const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  openFile: () => ipcRenderer.invoke("open-file"),
  adjustOpacity: (windowId, value) =>
    ipcRenderer.send("adjustOpacity", { windowId, value }),
  renderFile: (callback) => ipcRenderer.on("render-file", callback),
});

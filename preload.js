const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  openFile: () => ipcRenderer.invoke("open-file"),
  adjustOpacity: (value) => ipcRenderer.send("adjustOpacity", value),
});

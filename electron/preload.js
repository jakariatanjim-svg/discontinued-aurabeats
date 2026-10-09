const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  onUpdateAvailable: (callback) => ipcRenderer.on("update-available", (_event, info) => callback(info)),
  downloadUpdate: (url) => ipcRenderer.invoke("download-update", url),
});

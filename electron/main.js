const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "AuraBeats",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // needed to load local dist/index.html
    },
    autoHideMenuBar: true,
  });

  // Load built web app from dist folder (bundled alongside exe)
  const indexPath = path.join(__dirname, "dist", "index.html");
  mainWindow.loadFile(indexPath);

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

const { app, BrowserWindow, shell, dialog, ipcMain } = require("electron");
const path = require("path");
const https = require("https");
const fs = require("fs");
const { execFile } = require("child_process");

const GITHUB_REPO = "jakariatanjim-svg/aurabeats";
const CURRENT_VERSION = app.getVersion();

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
      webSecurity: false,
      preload: path.join(__dirname, "preload.js"),
    },
    autoHideMenuBar: true,
  });

  const indexPath = path.join(__dirname, "app-bundle", "index.html");
  mainWindow.loadFile(indexPath);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Check for updates silently after window loads
  mainWindow.webContents.on("did-finish-load", () => {
    setTimeout(checkForUpdate, 5000);
  });
}

function checkForUpdate() {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
  
  https.get(url, { headers: { "User-Agent": "AuraBeats-Desktop" } }, (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      try {
        const release = JSON.parse(data);
        const exeAsset = (release.assets || []).find(
          (a) => a.name === "AuraBeats-Portable.exe"
        );

        if (exeAsset && release.tag_name !== CURRENT_VERSION) {
          mainWindow?.webContents.send("update-available", {
            version: release.tag_name,
            downloadUrl: exeAsset.browser_download_url,
            releaseName: release.name,
          });
        }
      } catch {
        // silently fail
      }
    });
  }).on("error", () => {});
}

// Handle update download from renderer
ipcMain.handle("download-update", async (_event, downloadUrl) => {
  const tempPath = path.join(app.getPath("temp"), "AuraBeats-Update.exe");

  return new Promise((resolve, reject) => {
    const followRedirect = (url) => {
      https.get(url, { headers: { "User-Agent": "AuraBeats-Desktop" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          followRedirect(res.headers.location);
          return;
        }
        const file = fs.createWriteStream(tempPath);
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          // Launch new exe and quit current
          execFile(tempPath, { detached: true, stdio: "ignore" }).unref();
          app.quit();
          resolve(true);
        });
      }).on("error", reject);
    };
    followRedirect(downloadUrl);
  });
});

app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

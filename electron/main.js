const { app, BrowserWindow, shell, dialog, ipcMain } = require("electron");
const path = require("path");
const https = require("https");
const fs = require("fs");
const { execFile } = require("child_process");
const { startLocalServer } = require("./local-server");

const GITHUB_REPO = "jakariatanjim-svg/aurabeats";
const CURRENT_VERSION = app.getVersion();

// Loopback ports used to serve the web bundle. Kept fixed (with two spare
// fallbacks) so the renderer origin — and therefore its localStorage — stays
// stable across launches.
const LOCAL_PORTS = [46821, 46822, 46823];

// The hidden YouTube iframe must be able to start playback with sound from a
// JS command, without a user gesture reaching the off-screen player.
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

let mainWindow;
let localServer = null;
let localPort = null;

async function createWindow() {
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

  // Serve the bundle over loopback http instead of file://. The YouTube
  // IFrame player needs a real origin: the web build has https and the
  // Android build runs on Capacitor's https://localhost, while file:// gives
  // an opaque origin that breaks the widget's postMessage handshake. With a
  // loopback server the desktop build behaves exactly like those two.
  if (!localServer) {
    const started = await startLocalServer(path.join(__dirname, "app-bundle"), LOCAL_PORTS);
    if (started) {
      localServer = started.server;
      localPort = started.port;
    }
  }

  if (localServer) {
    mainWindow.loadURL(`http://127.0.0.1:${localPort}/`);
  } else {
    // Last-resort fallback if no loopback port could be bound at all.
    mainWindow.loadFile(path.join(__dirname, "app-bundle", "index.html"));
  }

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

// Only one instance may run: a second copy would steal the loopback port
// and split the renderer's localStorage across two origins.
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(createWindow);
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
  app.on("will-quit", () => {
    if (localServer) localServer.close();
  });
}

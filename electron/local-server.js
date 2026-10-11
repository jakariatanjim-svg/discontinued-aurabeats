// Minimal loopback static file server for the packaged web bundle.
//
// Why this exists: the YouTube IFrame player only works when the embedding
// page has a real (non-opaque) origin. The website runs on https, and the
// Android app runs on Capacitor's https://localhost server (see
// capacitor.config.ts -> server.androidScheme), which is why playback works
// there. A plain BrowserWindow.loadFile() gives the renderer an opaque
// file:// origin ("null"), and the YouTube widget's postMessage trust
// handshake breaks in that context: commands are dropped and playback dies
// with a player error.
//
// Serving the very same bundle from http://127.0.0.1:<port> puts the desktop
// build in the identical situation as the two platforms where playback is
// already known to work. The server is loopback-only and read-only.
const http = require("http");
const fs = require("fs");
const path = require("path");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
};

function createRequestHandler(rootDir) {
  const indexFile = path.join(rootDir, "index.html");

  return (req, res) => {
    let pathname = "/";
    try {
      pathname = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname);
    } catch {
      res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Bad request");
      return;
    }

    let filePath = path.normalize(path.join(rootDir, pathname));

    // Directory traversal guard: never serve anything outside the bundle.
    if (filePath !== rootDir && !filePath.startsWith(rootDir + path.sep)) {
      res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Forbidden");
      return;
    }

    fs.stat(filePath, (statErr, st) => {
      if (!statErr && st.isDirectory()) filePath = path.join(filePath, "index.html");

      fs.readFile(filePath, (readErr, data) => {
        if (readErr) {
          // SPA fallback: the app routes with real paths (/search, /library,
          // ...) via history.pushState, so unknown paths must return the app
          // shell instead of a 404, exactly like the _redirects catch-all on
          // the static web host.
          fs.readFile(indexFile, (shellErr, shell) => {
            if (shellErr) {
              res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
              res.end("Not found");
              return;
            }
            res.writeHead(200, {
              "Content-Type": MIME[".html"],
              "Cache-Control": "no-cache",
            });
            res.end(shell);
          });
          return;
        }

        res.writeHead(200, {
          "Content-Type": MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream",
          "Cache-Control": "no-cache",
        });
        res.end(data);
      });
    });
  };
}

// Tries each port in order and resolves with { server, port }, or null when
// none of them can be bound. A stable port matters: the renderer's
// localStorage is scoped per origin, so keeping the same port across launches
// keeps saved playlists and history intact.
function startLocalServer(rootDir, ports) {
  const tryPort = (i) =>
    new Promise((resolve) => {
      if (i >= ports.length) {
        resolve(null);
        return;
      }
      const server = http.createServer(createRequestHandler(rootDir));
      const onError = () => {
        server.removeListener("error", onError);
        try {
          server.close();
        } catch {
          /* ignore */
        }
        tryPort(i + 1).then(resolve);
      };
      server.once("error", onError);
      server.listen(ports[i], "127.0.0.1", () => {
        server.removeListener("error", onError);
        resolve({ server, port: ports[i] });
      });
    });
  return tryPort(0);
}

module.exports = { createRequestHandler, startLocalServer };

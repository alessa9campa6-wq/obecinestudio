// CineStudio per Mac — finestra desktop che apre la versione web dell'app.
//
// La cartella "web" (creata da build.js con `expo export --platform web`) viene
// servita da un piccolo server locale su 127.0.0.1: serve perché l'app usa i
// percorsi delle schermate (/progetto/xyz), che da un semplice file:// non
// funzionerebbero.
const { app, BrowserWindow, Menu, session, shell, nativeTheme } = require("electron");
const http = require("http");
const fs = require("fs");
const path = require("path");

const WEB = path.join(__dirname, "web");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".pdf": "application/pdf",
  ".map": "application/json; charset=utf-8",
};

function serve() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let urlPath = "/";
      try {
        urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
      } catch {
        urlPath = "/";
      }
      let file = path.join(WEB, urlPath === "/" ? "index.html" : urlPath);
      // niente accessi fuori dalla cartella dell'app
      if (!file.startsWith(WEB)) {
        res.statusCode = 403;
        res.end("Forbidden");
        return;
      }
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        // qualunque altra rotta è una schermata dell'app: si ricarica index.html
        file = path.join(WEB, "index.html");
      }
      if (!fs.existsSync(file)) {
        res.statusCode = 404;
        res.end("Not found");
        return;
      }
      const ext = path.extname(file).toLowerCase();
      res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
      res.setHeader("Cache-Control", "no-cache");
      fs.createReadStream(file).pipe(res);
    });
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function buildMenu(win) {
  const isMac = process.platform === "darwin";
  const template = [
    ...(isMac
      ? [
          {
            label: "CineStudio",
            submenu: [
              { role: "about", label: "Informazioni su CineStudio" },
              { type: "separator" },
              { role: "hide", label: "Nascondi CineStudio" },
              { role: "hideOthers", label: "Nascondi gli altri" },
              { role: "unhide", label: "Mostra tutto" },
              { type: "separator" },
              { role: "quit", label: "Esci da CineStudio" },
            ],
          },
        ]
      : []),
    {
      label: "Modifica",
      submenu: [
        { role: "undo", label: "Annulla" },
        { role: "redo", label: "Ripeti" },
        { type: "separator" },
        { role: "cut", label: "Taglia" },
        { role: "copy", label: "Copia" },
        { role: "paste", label: "Incolla" },
        { role: "selectAll", label: "Seleziona tutto" },
      ],
    },
    {
      label: "Vista",
      submenu: [
        {
          label: "Ricarica",
          accelerator: "CmdOrCtrl+R",
          click: () => win.webContents.reload(),
        },
        { role: "resetZoom", label: "Dimensione originale" },
        { role: "zoomIn", label: "Ingrandisci" },
        { role: "zoomOut", label: "Riduci" },
        { type: "separator" },
        { role: "togglefullscreen", label: "Schermo intero" },
        {
          label: "Strumenti sviluppatore",
          accelerator: "Alt+CmdOrCtrl+I",
          click: () => win.webContents.toggleDevTools(),
        },
      ],
    },
    {
      label: "Finestra",
      submenu: [
        { role: "minimize", label: "Riduci a icona" },
        { role: "zoom", label: "Ingrandisci finestra" },
        { role: "close", label: "Chiudi" },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function createWindow() {
  const server = await serve();
  const { port } = server.address();

  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 700,
    title: "CineStudio",
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#101010" : "#fafafa",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true,
      autoplayPolicy: "no-user-gesture-required",
    },
  });

  // La fotocamera del viewfinder e il microfono servono all'app: si concedono
  // solo alla finestra interna, non a pagine esterne.
  session.defaultSession.setPermissionRequestHandler((_contents, permission, callback, details) => {
    const origin = details && details.requestingUrl ? details.requestingUrl : "";
    const local = origin.startsWith("http://127.0.0.1") || origin === "";
    const allowed = ["media", "camera", "microphone", "clipboard-sanitized-write", "fullscreen"];
    callback(local && allowed.includes(permission));
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://127.0.0.1")) return { action: "allow" };
    shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(`http://127.0.0.1:${port}`)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  buildMenu(win);
  await win.loadURL(`http://127.0.0.1:${port}/`);
  win.focus();

  app.on("before-quit", () => server.close());
}

app.setName("CineStudio");
app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());

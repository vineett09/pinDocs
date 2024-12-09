const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

// Store multiple file windows
let mainWindow;
let fileWindows = [];

app.whenReady().then(() => {
  createMainWindow();
});

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      enableRemoteModule: true,
    },
  });

  mainWindow.loadFile("index.html");
}

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("open-file", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      { name: "Images", extensions: ["jpg", "png", "gif"] },
      { name: "Documents", extensions: ["pdf", "docx", "txt"] },
    ],
  });

  if (canceled || filePaths.length === 0) return;

  const filePath = filePaths[0];
  const fileExtension = path.extname(filePath).toLowerCase();
  let fileContent;

  if (fileExtension === ".pdf") {
    fileContent = `file://${filePath}`;
  } else if ([".jpg", ".png", ".gif"].includes(fileExtension)) {
    fileContent = `data:image/${fileExtension.slice(1)};base64,${fs
      .readFileSync(filePath)
      .toString("base64")}`;
  } else if ([".txt"].includes(fileExtension)) {
    fileContent = fs.readFileSync(filePath, "utf-8");
  } else {
    fileContent = "Unsupported file type";
  }

  createFileWindow(fileContent, fileExtension);
});

ipcMain.on("adjustOpacity", (event, { windowId, value }) => {
  const fileWindow = fileWindows.find((w) => w.id === windowId);
  if (fileWindow) {
    fileWindow.window.setOpacity(parseFloat(value));
  }
});

function createFileWindow(fileContent, fileExtension) {
  const fileWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      enableRemoteModule: true,
    },
    resizable: true,
    minimizable: false,
    maximizable: false,
  });

  const windowId = Date.now().toString(); // Unique ID for each window

  fileWindow.loadFile("fileWindow.html");

  fileWindow.webContents.once("did-finish-load", () => {
    fileWindow.webContents.send("render-file", {
      fileContent,
      fileExtension,
      windowId,
    });
  });

  fileWindow.on("closed", () => {
    const index = fileWindows.findIndex((w) => w.id === windowId);
    if (index !== -1) {
      fileWindows.splice(index, 1);
    }
  });

  // Store the window with its unique ID
  fileWindows.push({ id: windowId, window: fileWindow });
}

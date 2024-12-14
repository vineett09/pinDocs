const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { createCustomMenu } = require("./menu");
// Store multiple file windows
let mainWindow;
let fileWindows = [];

app.whenReady().then(() => {
  createMainWindow();
  createCustomMenu();
});

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: "PinDocs",
    icon: path.join(__dirname, "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
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

const logError = (error) => {
  const errorLogPath = path.join(__dirname, "error.log");
  const errorMessage = `[${new Date().toISOString()}] ${error.message}\n${
    error.stack
  }\n\n`;
  fs.appendFileSync(errorLogPath, errorMessage); // Log errors to a file
};

ipcMain.handle("open-file", async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [
        { name: "Images", extensions: ["jpg", "png", "gif"] },
        { name: "Documents", extensions: ["pdf", "txt"] },
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
  } catch (error) {
    logError(error); // Log error to file
    dialog.showErrorBox(
      "File Open Error",
      "There was an error opening the file. Please try again."
    );
  }
});

ipcMain.handle("add-note", async () => {
  try {
    createNoteWindow();
  } catch (error) {
    logError(error); // Log error to file
    dialog.showErrorBox(
      "Note Creation Error",
      "There was an error creating a new note. Please try again."
    );
  }
});

function createNoteWindow() {
  try {
    const noteWindow = new BrowserWindow({
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

    noteWindow.loadFile("noteWindow.html");

    noteWindow.webContents.once("did-finish-load", () => {
      noteWindow.webContents.send("render-file", {
        windowId,
      });
    });

    noteWindow.on("closed", () => {
      const index = fileWindows.findIndex((w) => w.id === windowId);
      if (index !== -1) {
        fileWindows.splice(index, 1);
      }
    });

    fileWindows.push({ id: windowId, window: noteWindow });
  } catch (error) {
    logError(error); // Log error to file
    dialog.showErrorBox(
      "Note Window Error",
      "There was an error creating the note window. Please try again."
    );
  }
}

ipcMain.on("adjustOpacity", (event, { windowId, value }) => {
  try {
    const fileWindow = fileWindows.find((w) => w.id === windowId);
    if (!fileWindow) {
      throw new Error("Window not found");
    }
    fileWindow.window.setOpacity(parseFloat(value));
  } catch (error) {
    logError(error); // Log error to file
    dialog.showErrorBox(
      "Opacity Adjustment Error",
      "There was an error adjusting the window opacity. Please try again."
    );
  }
});

function createFileWindow(fileContent, fileExtension) {
  try {
    const isTextFile = fileExtension === ".txt";

    const fileWindow = new BrowserWindow({
      width: 800,
      height: 600,
      frame: false,
      transparent: !isTextFile, // Disable transparency for text files
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

    fileWindows.push({ id: windowId, window: fileWindow });
  } catch (error) {
    logError(error); // Log error to file
    dialog.showErrorBox(
      "Window Creation Error",
      "There was an error creating the file window. Please try again."
    );
  }
}

// Close a specific window
ipcMain.on("close-specific-window", (event, windowId) => {
  const windowToClose = fileWindows.find((w) => w.id === windowId);
  if (windowToClose) {
    windowToClose.window.close();
    // Remove the window from the fileWindows array
    fileWindows = fileWindows.filter((w) => w.id !== windowId);
  }
});

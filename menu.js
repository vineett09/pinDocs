import { Menu } from "electron";

export function createCustomMenu() {
  const defaultMenu = Menu.buildFromTemplate([
    {
      label: "Edit",
      submenu: [
        { label: "Undo", role: "undo" },
        { label: "Redo", role: "redo" },
        { type: "separator" },
        { label: "Cut", role: "cut" },
        { label: "Copy", role: "copy" },
        { label: "Paste", role: "paste" },
        { label: "Select All", role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { label: "Reload", role: "reload" },
        { label: "Toggle DevTools", role: "toggleDevTools" },
      ],
    },
    {
      label: "Window",
      submenu: [
        { label: "Minimize", role: "minimize" },
        { label: "Close", role: "close" },
      ],
    },
  ]);

  Menu.setApplicationMenu(defaultMenu);
}

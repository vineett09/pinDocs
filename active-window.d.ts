declare module "active-window" {
  interface WindowDetails {
    app: string;
    title: string;
    owner: {
      name: string;
    };
  }

  function getActiveWindow(
    callback: (err: Error | null, result: WindowDetails) => void
  ): void;

  export = getActiveWindow;
}

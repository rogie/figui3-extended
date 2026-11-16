declare module "@rogieking/figui3/extended-runtime.js" {
  export class AsyncOperationOwner {
    readonly disposed: boolean;
    begin(): {
      isCurrent(): boolean;
      own(cleanup: () => void | Promise<void>): {
        dispose(): void;
        forget(): void;
      };
    };
    cancel(): void;
    dispose(): void;
  }
}

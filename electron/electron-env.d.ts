/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

// Used in Renderer process, expose in `preload.ts`
interface Window {
  ipcRenderer: import('electron').IpcRenderer
  testManager: {
    discoverCppTests: (executablePath: string) => Promise<string[]>
    runCppTest: (executablePath: string, testName: string) => Promise<{
      startedAt: string
      duration: number
      status: 'passed' | 'failed'
      message: string
      expected?: string
      actual?: string
    }>
  }
}

import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { execFile } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)

// --------- C++ adapter ---------
// Bridges Test Manager to any plain C++ executable (no test framework required) through a
// tiny CLI protocol:
//   <exe> --list-tests            -> prints one test name per line to stdout
//   <exe> --run-test <TestName>   -> runs that single test
//                                    exit code 0 = passed, non-zero = failed
//                                    optional stdout lines: EXPECTED:, ACTUAL:, MESSAGE:

type CppTestRunResult = {
  startedAt: string
  duration: number
  status: 'passed' | 'failed'
  message: string
  expected?: string
  actual?: string
}

function parseTestNames(output: string): string[] {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

function parseRunOutput(stdout: string, passed: boolean, startedAt: string, duration: number): CppTestRunResult {
  const values: Record<string, string> = {}

  for (const rawLine of stdout.split(/\r?\n/)) {
    const separatorIndex = rawLine.indexOf(':')
    if (separatorIndex === -1) continue

    const key = rawLine.slice(0, separatorIndex).trim().toUpperCase()
    const value = rawLine.slice(separatorIndex + 1).trim()
    if (key === 'EXPECTED' || key === 'ACTUAL' || key === 'MESSAGE') values[key] = value
  }

  if (passed) {
    return { startedAt, duration, status: 'passed', message: values.MESSAGE ?? 'Test completed successfully.' }
  }

  return {
    startedAt,
    duration,
    status: 'failed',
    message: values.MESSAGE ?? (values.EXPECTED && values.ACTUAL ? 'Test failed.' : stdout.trim() || 'Test failed.'),
    expected: values.EXPECTED,
    actual: values.ACTUAL,
  }
}

ipcMain.handle('cpp:discover-tests', (_event, executablePath: string) => {
  return new Promise<string[]>((resolve, reject) => {
    execFile(executablePath, ['--list-tests'], (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message))
        return
      }
      resolve(parseTestNames(stdout))
    })
  })
})

ipcMain.handle('cpp:run-test', (_event, executablePath: string, testName: string) => {
  const startedAt = new Date().toISOString()
  const startedAtMs = Date.now()

  return new Promise<CppTestRunResult>((resolve) => {
    execFile(executablePath, ['--run-test', testName], (error, stdout) => {
      const duration = Number(((Date.now() - startedAtMs) / 1000).toFixed(3))
      const passed = !error
      resolve(parseRunOutput(stdout, passed, startedAt, duration))
    })
  })
})

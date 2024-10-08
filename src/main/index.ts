import { app, shell, BrowserWindow, crashReporter } from 'electron'
import { autoUpdater } from 'electron-updater'
import { join } from 'path'
import './ipc'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer'
import icon from '@main/assets/icon.png?asset'
import Database from '@main/database/index'

/** type */
import { LOG_LEVEL, LOG_MASSAGE } from './contents/enum'

/** composable */
import { logger } from './utils/logger'

function createWindow(): void {
  // windowを作成
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    show: false,
    center: true, // 中央配置
    title: 'Doon NoteBook',
    vibrancy: 'appearance-based', // macOS ウインドウに曇ガラスのエフェクトの設定
    visualEffectState: 'active', // macOS ウインドウの動作状態を設定
    titleBarStyle: 'hidden', // タイトルバーを隠す
    titleBarOverlay: true, // ウィンドウコントロールオーバーレイ
    trafficLightPosition: { x: 15, y: 10 }, // フレームレスウインドウの信号機ボタンのカスタム位置を設定
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true, // サンドボックス
      contextIsolation: true // コンテキストの分離
    }
  })

  mainWindow.on('ready-to-show', async (): Promise<void> => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    console.log(`URL: `, process.env['ELECTRON_RENDERER_URL'])
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // デバッグ
  if (is.dev) {
    mainWindow.webContents.openDevTools()
  }

  // 自動アップデート
  if (!is.dev) {
    autoUpdater.checkForUpdates()
  }
}

// クラッシュレポート
crashReporter.start({
  uploadToServer: false
})

// 初期化処理、ブラウザウィンドウのセッティング
app.whenReady().then(() => {
  logger(LOG_LEVEL.INFO, LOG_MASSAGE.APP_START)

  try {
    // Electron DevTools： https://github.com/MarshallOfSound/electron-devtools-installer
    installExtension(REACT_DEVELOPER_TOOLS)
      .then((name) => console.log(`Added Extension:  ${name}`))
      .catch((err) => console.log('An error occurred: ', err))

    // セットアップ
    electronApp.setAppUserModelId('com.electron')

    // see： https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', async (_, window): Promise<void> => {
      optimizer.watchWindowShortcuts(window)
    })

    createWindow()

    app.on('activate', function () {
      //  (macOS用)
      // ウィンドウが1つも無いときにドックのアイコンを押したらウィンドウを出す
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  } catch (error: any) {
    logger(LOG_LEVEL.ERROR, `Error while creating dev environment: ${error}`)

    app.quit()
  }
})

app.on('will-finish-launching', async (): Promise<void> => {
  // DB接続
  await Database.createConnection()
})

// NOTE: ウィンドウが全部閉じられたらアプリを終了
app.on('window-all-closed', async (): Promise<void> => {
  if (process.platform !== 'darwin') {
    // macOS 以外の場合、アプリケーションを終了する
    logger(LOG_LEVEL.INFO, LOG_MASSAGE.APP_FINISH)
    app.quit()
  }
})

// DB接続の終了
app.on('will-quit', (): void => {
  Database.close()
})

const isTheLock = app.requestSingleInstanceLock()

// NOTE: 既にアプリが起動されていたら、新規に起動したアプリを終了
if (!isTheLock) {
  app.quit()
}

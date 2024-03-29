/** ログ */
export const LOG_LEVEL = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info'
} as const

export const LOG_MASSAGE = {
  APP_START: 'アプリケーションが起動しました。',
  APP_FINISH: 'アプリケーションが閉じました。'
}

export const ERROR_MASSAGE = {
  MUST_USE_CONTEXT_ISOLATION: 'browser Windowではコンテキストの分離が必須です。'
}

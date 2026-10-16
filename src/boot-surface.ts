/**
 * Epic 1 title+New boot mount retired — production chrome lives in `chrome/`.
 * New confirm helpers moved to `chrome/new-confirm.ts` (BOOT_NEW = RELOCATE).
 * Re-export for any transitional imports; prefer `mountChromeShell`.
 */
export { NEW_CONFIRM_BODY, openNewConfirmModal } from './chrome/new-confirm'

; ─── Waggle NSIS Installer Template ──────────────────────────────────────────
;
; This file extends the default Tauri NSIS installer with custom behavior:
;   1. Welcome screen with Waggle branding
;   2. Install directory picker (default: C:\Program Files\Waggle)
;   3. Desktop shortcut creation
;   4. Start Menu entry
;   5. Autostart via registry
;   6. "Launch Waggle" checkbox on finish
;   7. Uninstaller with optional ~/.waggle/ data removal
;
; Tauri injects its own NSIS defines (PRODUCT_NAME, PRODUCT_VERSION, etc.)
; and handles the core install/uninstall logic. This file provides hooks
; via the Tauri NSIS extension points.
;
; Reference: https://tauri.app/distribute/windows-installer/#nsis
; ─────────────────────────────────────────────────────────────────────────────

; Default install directory — provides a sensible default in the dir picker
InstallDir "${DEFAULT_INSTALL_DIR}"

!macro NSIS_HOOK_PREINSTALL
  ; Displayed before the install begins — custom welcome text
  DetailPrint "Installing ${PRODUCT_NAME} v${PRODUCT_VERSION}..."
  DetailPrint "Your AI Agent Swarm — powered by Waggle."
!macroend

!macro NSIS_HOOK_POSTINSTALL
  ; ── Desktop shortcut (conditional) ──────────────────────────────────────────
  !if "${DESKTOP_SHORTCUT}" == "1"
    CreateShortcut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe" \
      "" "$INSTDIR\${MAINBINARYNAME}.exe" 0
    DetailPrint "Desktop shortcut created."
  !endif

  ; ── Start Menu entry (conditional) ──────────────────────────────────────────
  !if "${START_MENU_ENTRY}" == "1"
    CreateDirectory "$SMPROGRAMS\${PRODUCT_NAME}"
    CreateShortcut "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk" \
      "$INSTDIR\${MAINBINARYNAME}.exe" "" "$INSTDIR\${MAINBINARYNAME}.exe" 0
    CreateShortcut "$SMPROGRAMS\${PRODUCT_NAME}\Uninstall ${PRODUCT_NAME}.lnk" \
      "$INSTDIR\uninstall.exe" "" "$INSTDIR\uninstall.exe" 0
    DetailPrint "Start Menu entry created."
  !endif

  ; ── Autostart via registry (conditional) ────────────────────────────────────
  !if "${AUTOSTART}" == "1"
    ; Run Waggle at Windows startup (current user)
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" \
      "${PRODUCT_NAME}" '"$INSTDIR\${MAINBINARYNAME}.exe" --autostart'
    DetailPrint "Autostart configured."
  !endif

  ; ── Launch after install (conditional) ──────────────────────────────────────
  !if "${LAUNCH_AFTER_INSTALL}" == "1"
    Exec '"$INSTDIR\${MAINBINARYNAME}.exe"'
    DetailPrint "Launching ${PRODUCT_NAME}..."
  !endif
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  ; ── Remove desktop shortcut ───────────────────────────────────────────────
  Delete "$DESKTOP\${PRODUCT_NAME}.lnk"

  ; ── Remove Start Menu entries ─────────────────────────────────────────────
  Delete "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk"
  Delete "$SMPROGRAMS\${PRODUCT_NAME}\Uninstall ${PRODUCT_NAME}.lnk"
  RMDir "$SMPROGRAMS\${PRODUCT_NAME}"

  ; ── Remove autostart registry key ─────────────────────────────────────────
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" \
    "${PRODUCT_NAME}"

  ; ── Ask about user data removal ───────────────────────────────────────────
  MessageBox MB_YESNO|MB_ICONQUESTION \
    "Waggle stores your personal data (agents, memories, configuration) in:$\r$\n$\r$\n\
     $PROFILE\.waggle$\r$\n$\r$\n\
     Do you want to remove this data as well?$\r$\n$\r$\n\
     Choose $\"Yes$\" to delete all data, or $\"No$\" to keep it for future use." \
    IDYES removeData IDNO skipData

  removeData:
    RMDir /r "$PROFILE\.waggle"
    DetailPrint "User data removed: $PROFILE\.waggle"
    Goto doneData

  skipData:
    DetailPrint "User data preserved: $PROFILE\.waggle"

  doneData:
!macroend

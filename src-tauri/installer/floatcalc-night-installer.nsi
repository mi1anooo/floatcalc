; ============================================================
; FloatCalc Night Mode NSIS Installer Template for Tauri v1
; Place at: src-tauri/installer/floatcalc-night-installer.nsi
; Configure in tauri.conf.json under tauri.bundle.windows.nsis.template
; ============================================================

Unicode true
XPStyle on

; Compression: Tauri injects this value. Defaults to LZMA.
!if "{{compression}}" == ""
  SetCompressor /SOLID lzma
!else
  SetCompressor /SOLID "{{compression}}"
!endif

!include MUI2.nsh
!include LogicLib.nsh
!include nsDialogs.nsh
!include FileFunc.nsh
!include x64.nsh
!include WinMessages.nsh

; ---------- Tauri injected values ----------
!define MANUFACTURER "{{manufacturer}}"
!define PRODUCTNAME "{{product_name}}"
!define VERSION "{{version}}"
!define VERSIONWITHBUILD "{{version_with_build}}"
!define INSTALLMODE "{{install_mode}}"
!define INSTALLERICON "{{installer_icon}}"
!define SIDEBARIMAGE "{{sidebar_image}}"
!define HEADERIMAGE "{{header_image}}"
!define MAINBINARYNAME "{{main_binary_name}}"
!define MAINBINARYSRCPATH "{{main_binary_path}}"
!define BUNDLEID "{{bundle_id}}"
!define COPYRIGHT "{{copyright}}"
!define OUTFILE "{{out_file}}"
!define ARCH "{{arch}}"
!define ESTIMATEDSIZE "{{estimated_size}}"
!define DISPLAYLANGUAGESELECTOR "{{display_language_selector}}"
!define ALLOWDOWNGRADES "{{allow_downgrades}}"

; ---------- FloatCalc night theme colors ----------
; These match src/styles/globals.css night mode.
!define FC_BG "1A1A1E"
!define FC_PANEL "16161A"
!define FC_DISPLAY "111114"
!define FC_CARD "202026"
!define FC_BUTTON "2A2A30"
!define FC_PURPLE "5B3DE8"
!define FC_PURPLE_SOFT "3A3060"
!define FC_TEXT "F0F0F5"
!define FC_MUTED "8888A0"
!define FC_RESULT "C4B5FD"
!define FC_ERROR "F87171"

; ---------- App metadata ----------
Name "${PRODUCTNAME}"
Caption "${PRODUCTNAME} Setup"
OutFile "${OUTFILE}"
BrandingText "${PRODUCTNAME}"
VIProductVersion "${VERSIONWITHBUILD}"
VIAddVersionKey "ProductName" "${PRODUCTNAME}"
VIAddVersionKey "FileDescription" "${PRODUCTNAME} Setup"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "LegalCopyright" "${COPYRIGHT}"

; ---------- Install mode ----------
!if "${INSTALLMODE}" == "perMachine"
  RequestExecutionLevel highest
!else
  RequestExecutionLevel user
!endif

; ---------- Registry keys ----------
!define UNINSTKEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCTNAME}"
!define MANUPRODUCTKEY "Software\${PRODUCTNAME}"

; ---------- Install defaults ----------
InstallDir "$LOCALAPPDATA\${PRODUCTNAME}"
ShowInstDetails show
ShowUninstDetails show
AutoCloseWindow false

; ---------- Modern UI theme ----------
!define MUI_ABORTWARNING
!define MUI_BGCOLOR "${FC_BG}"
!define MUI_TEXTCOLOR "${FC_TEXT}"
!define MUI_INSTFILESPAGE_COLORS "${FC_TEXT} ${FC_DISPLAY}"
!define MUI_FINISHPAGE_LINK_COLOR "${FC_RESULT}"
; Let MUI own the .onGUIInit callback, then call our custom theme function from it.
; Do not define Function .onGUIInit directly, because MUI already creates that callback.
!define MUI_CUSTOMFUNCTION_GUIINIT FloatCalcGUIInit

!if "${INSTALLERICON}" != ""
  !define MUI_ICON "${INSTALLERICON}"
  !define MUI_UNICON "${INSTALLERICON}"
!endif

!if "${SIDEBARIMAGE}" != ""
  !define MUI_WELCOMEFINISHPAGE_BITMAP "${SIDEBARIMAGE}"
  !define MUI_UNWELCOMEFINISHPAGE_BITMAP "${SIDEBARIMAGE}"
!endif

!if "${HEADERIMAGE}" != ""
  !define MUI_HEADERIMAGE
  !define MUI_HEADERIMAGE_BITMAP "${HEADERIMAGE}"
  !define MUI_HEADERIMAGE_RIGHT
!endif

; ---------- Pages ----------
!define MUI_WELCOMEPAGE_TITLE "Welcome to ${PRODUCTNAME}"
!define MUI_WELCOMEPAGE_TEXT "A premium floating calculator for quick calculations, keyboard-first workflows, and organized calculation history.$\r$\n$\r$\nSetup will install ${PRODUCTNAME} on your computer.$\r$\n$\r$\nClick Next to continue."
!insertmacro MUI_PAGE_WELCOME

; Dark maintenance page shown only if an install already exists.
Var ReinstallChoice
Var ReinstallRadioRepair
Var ReinstallRadioUninstall
Page custom PageReinstall PageLeaveReinstall

!define MUI_PAGE_CUSTOMFUNCTION_SHOW DirectoryShow
!insertmacro MUI_PAGE_DIRECTORY

!insertmacro MUI_PAGE_INSTFILES

!define MUI_FINISHPAGE_NOAUTOCLOSE
!define MUI_FINISHPAGE_RUN
!define MUI_FINISHPAGE_RUN_TEXT "Launch ${PRODUCTNAME}"
!define MUI_FINISHPAGE_RUN_FUNCTION RunMainBinary
!define MUI_FINISHPAGE_SHOWREADME
!define MUI_FINISHPAGE_SHOWREADME_TEXT "Create a desktop shortcut"
!define MUI_FINISHPAGE_SHOWREADME_FUNCTION CreateDesktopShortcut
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; ---------- Languages ----------
{{#each languages}}
!insertmacro MUI_LANGUAGE "{{this}}"
{{/each}}

; ---------- Context helpers ----------
!macro SetContext
  !if "${INSTALLMODE}" == "currentUser"
    SetShellVarContext current
  !else
    SetShellVarContext all
  !endif

  ${If} ${RunningX64}
    !if "${ARCH}" == "x64"
      SetRegView 64
    !else if "${ARCH}" == "arm64"
      SetRegView 64
    !else
      SetRegView 32
    !endif
  ${EndIf}
!macroend

Function .onInit
  !if "${DISPLAYLANGUAGESELECTOR}" == "true"
    !insertmacro MUI_LANGDLL_DISPLAY
  !endif

  !insertmacro SetContext

  ${If} $INSTDIR == ""
    !if "${INSTALLMODE}" == "perMachine"
      ${If} ${RunningX64}
        StrCpy $INSTDIR "$PROGRAMFILES64\${PRODUCTNAME}"
      ${Else}
        StrCpy $INSTDIR "$PROGRAMFILES\${PRODUCTNAME}"
      ${EndIf}
    !else
      StrCpy $INSTDIR "$LOCALAPPDATA\${PRODUCTNAME}"
    !endif
  ${EndIf}

  Call RestorePreviousInstallLocation
FunctionEnd

Function un.onInit
  !insertmacro SetContext
FunctionEnd

; Applies extra dark styling to MUI shell controls.
Function FloatCalcGUIInit
  SetCtlColors $HWNDPARENT "${FC_TEXT}" "${FC_BG}"

  ; Header and footer surfaces used by Modern UI.
  GetDlgItem $0 $HWNDPARENT 1034
  SetCtlColors $0 "${FC_TEXT}" "${FC_BG}"
  GetDlgItem $0 $HWNDPARENT 1037
  SetCtlColors $0 "${FC_TEXT}" "${FC_BG}"
  GetDlgItem $0 $HWNDPARENT 1038
  SetCtlColors $0 "${FC_MUTED}" "${FC_BG}"
  GetDlgItem $0 $HWNDPARENT 1028
  SetCtlColors $0 "${FC_MUTED}" "${FC_PANEL}"
  GetDlgItem $0 $HWNDPARENT 1256
  SetCtlColors $0 "${FC_MUTED}" "${FC_PANEL}"
FunctionEnd

Function DirectoryShow
  ; Directory page specific controls. Some Windows controls keep their native look,
  ; but this prevents the main page from reverting to harsh white.
  FindWindow $0 "#32770" "" $HWNDPARENT
  SetCtlColors $0 "${FC_TEXT}" "${FC_BG}"
  GetDlgItem $1 $0 1006
  SetCtlColors $1 "${FC_TEXT}" "${FC_BG}"
  GetDlgItem $1 $0 1020
  SetCtlColors $1 "${FC_TEXT}" "${FC_BG}"
  GetDlgItem $1 $0 1019
  SetCtlColors $1 "${FC_TEXT}" "${FC_DISPLAY}"
FunctionEnd

Function RestorePreviousInstallLocation
  ReadRegStr $4 SHCTX "${MANUPRODUCTKEY}" ""
  ${If} $4 != ""
    StrCpy $INSTDIR $4
  ${EndIf}
FunctionEnd

; ---------- Existing install / maintenance page ----------
Function PageReinstall
  ReadRegStr $R0 SHCTX "${UNINSTKEY}" "DisplayName"
  ReadRegStr $R1 SHCTX "${UNINSTKEY}" "UninstallString"
  ${If} "$R0$R1" == ""
    Abort
  ${EndIf}

  !insertmacro MUI_HEADER_TEXT "Already Installed" "Choose the maintenance option to perform."

  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}

  SetCtlColors $0 "${FC_TEXT}" "${FC_BG}"

  ${NSD_CreateLabel} 0 0 100% 30u "${PRODUCTNAME} ${VERSION} is already installed. Select the operation you want to perform and click Next to continue."
  Pop $1
  SetCtlColors $1 "${FC_TEXT}" "${FC_BG}"

  ${NSD_CreateRadioButton} 22u 52u -22u 10u "Add/Reinstall components"
  Pop $ReinstallRadioRepair
  SetCtlColors $ReinstallRadioRepair "${FC_TEXT}" "${FC_BG}"
  System::Call 'UxTheme::SetWindowTheme(p$ReinstallRadioRepair,w" ",w" ")'

  ${NSD_CreateRadioButton} 22u 75u -22u 10u "Uninstall ${PRODUCTNAME}"
  Pop $ReinstallRadioUninstall
  SetCtlColors $ReinstallRadioUninstall "${FC_TEXT}" "${FC_BG}"
  System::Call 'UxTheme::SetWindowTheme(p$ReinstallRadioUninstall,w" ",w" ")'

  ${If} $ReinstallChoice == 2
    SendMessage $ReinstallRadioUninstall ${BM_SETCHECK} ${BST_CHECKED} 0
  ${Else}
    SendMessage $ReinstallRadioRepair ${BM_SETCHECK} ${BST_CHECKED} 0
  ${EndIf}

  nsDialogs::Show
FunctionEnd

Function PageLeaveReinstall
  ${NSD_GetState} $ReinstallRadioUninstall $0
  ${If} $0 == ${BST_CHECKED}
    StrCpy $ReinstallChoice 2
    ReadRegStr $R1 SHCTX "${UNINSTKEY}" "UninstallString"
    ReadRegStr $R2 SHCTX "${MANUPRODUCTKEY}" ""
    ${If} $R2 == ""
      StrCpy $R2 $INSTDIR
    ${EndIf}
    HideWindow
    ExecWait '$R1 /P _?=$R2' $0
    BringToFront
    Quit
  ${Else}
    StrCpy $ReinstallChoice 1
  ${EndIf}
FunctionEnd

; ---------- Installation ----------
Section "Install"
  SetOutPath "$INSTDIR"

  ; Copy main executable.
  File "${MAINBINARYSRCPATH}"

  ; Copy Tauri resources if your project ever adds any.
  {{#each resources_dirs}}
  CreateDirectory "$INSTDIR\{{this}}"
  {{/each}}
  {{#each resources}}
  File /a "/oname={{this.[1]}}" "{{unescape-dollar-sign @key}}"
  {{/each}}

  ; Copy external binaries if configured.
  {{#each binaries}}
  File /a "/oname={{this}}" "{{unescape-dollar-sign @key}}"
  {{/each}}

  WriteUninstaller "$INSTDIR\uninstall.exe"

  ; Save install location.
  WriteRegStr SHCTX "${MANUPRODUCTKEY}" "" "$INSTDIR"

  ; Add/Remove Programs metadata.
  WriteRegStr SHCTX "${UNINSTKEY}" "DisplayName" "${PRODUCTNAME}"
  WriteRegStr SHCTX "${UNINSTKEY}" "DisplayIcon" "$\"$INSTDIR\${MAINBINARYNAME}.exe$\""
  WriteRegStr SHCTX "${UNINSTKEY}" "DisplayVersion" "${VERSION}"
  WriteRegStr SHCTX "${UNINSTKEY}" "Publisher" "${PRODUCTNAME}"
  WriteRegStr SHCTX "${UNINSTKEY}" "InstallLocation" "$\"$INSTDIR$\""
  WriteRegStr SHCTX "${UNINSTKEY}" "UninstallString" "$\"$INSTDIR\uninstall.exe$\""
  WriteRegDWORD SHCTX "${UNINSTKEY}" "NoModify" 1
  WriteRegDWORD SHCTX "${UNINSTKEY}" "NoRepair" 1
  WriteRegDWORD SHCTX "${UNINSTKEY}" "EstimatedSize" "${ESTIMATEDSIZE}"

  Call CreateStartMenuShortcut
SectionEnd

Function RunMainBinary
  ExecShell "open" "$INSTDIR\${MAINBINARYNAME}.exe"
FunctionEnd

Function CreateDesktopShortcut
  CreateShortcut "$DESKTOP\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe"
FunctionEnd

Function CreateStartMenuShortcut
  CreateDirectory "$SMPROGRAMS\${PRODUCTNAME}"
  CreateShortcut "$SMPROGRAMS\${PRODUCTNAME}\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe"
FunctionEnd

; ---------- Uninstall ----------
Section "Uninstall"
  Delete "$INSTDIR\${MAINBINARYNAME}.exe"

  {{#each resources}}
  Delete "$INSTDIR\{{this.[1]}}"
  {{/each}}
  {{#each binaries}}
  Delete "$INSTDIR\{{this}}"
  {{/each}}

  Delete "$INSTDIR\uninstall.exe"
  Delete "$DESKTOP\${PRODUCTNAME}.lnk"
  Delete "$SMPROGRAMS\${PRODUCTNAME}\${PRODUCTNAME}.lnk"
  RMDir "$SMPROGRAMS\${PRODUCTNAME}"
  RMDir "$INSTDIR"

  !if "${INSTALLMODE}" == "perMachine"
    DeleteRegKey HKLM "${UNINSTKEY}"
  !else
    DeleteRegKey HKCU "${UNINSTKEY}"
  !endif
  DeleteRegKey HKCU "${MANUPRODUCTKEY}"
SectionEnd

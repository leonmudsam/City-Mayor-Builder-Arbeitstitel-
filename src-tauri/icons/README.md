# App-Icons (einmalig erzeugen)

Der Desktop-Build (`npm run tauri:build`) braucht die in `tauri.conf.json` unter
`bundle.icon` gelisteten Icon-Dateien (`32x32.png`, `128x128.png`,
`128x128@2x.png`, `icon.icns`, `icon.ico`). Diese werden **nicht** eingecheckt,
sondern lokal aus einer Quellgrafik generiert:

```bash
# Quelle: ein quadratisches PNG (idealerweise 1024×1024).
npx tauri icon pfad/zu/quelle-1024.png
```

Das erzeugt alle benötigten Formate (PNG/ICO/ICNS) hier in `src-tauri/icons/`.
Bis das passiert ist, schlägt `tauri:build` mit „icon not found" fehl — der
Frontend-/Browser-Pfad (`npm run dev` / `npm run build`) ist davon unberührt.

Tipp: Als Quelle eignet sich ein 1024×1024-Export von `public/favicon.svg`.

# Eidklinge: Glut der Nachtwacht

Ein eigenständiges 3D-Fantasy-Schwertkampfspiel für den Browser. Du kämpfst mit der Eidklinge gegen Aschenlaeufer, Dornhueter, Glutritter, Glasspeer-Duellanten und den Glutregenten in fünf Arenen.

## Online spielen

GitHub Pages:

https://allenhermanebol-max.github.io/Website-lovable/

## Steuerung

- `W`, `A`, `S`, `D`: bewegen
- Maus: Blickrichtung
- Linke Maustaste: Angriff / Combo
- Rechte Maustaste oder `Shift`: blocken
- `Leertaste`: ausweichen
- `ESC`: Pause

## Technologien

- HTML
- CSS
- JavaScript ES Modules
- Three.js für 3D-Grafik
- Vite für Entwicklung und Build
- GitHub Actions + GitHub Pages für Deployment

## Lokal starten

```powershell
npm install
npm run dev
```

Dann im Browser öffnen:

```text
http://127.0.0.1:5173/
```

## Build prüfen

```powershell
npm test
npm run build
npm audit --audit-level=moderate
```

## Änderungen veröffentlichen

Nach Änderungen lokal prüfen:

```powershell
npm test
npm run build
git add .
git commit -m "Update game"
git push
```

Der GitHub-Actions-Workflow baut danach automatisch den `dist`-Ordner und veröffentlicht ihn über GitHub Pages.

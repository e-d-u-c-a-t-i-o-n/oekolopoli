# Oekolopoly

Ein kompakter JavaScript-Prototyp fuer ein Oekolopoly-inspiriertes Simulationsspiel.

## Start

Die App ist bewusst ohne Build-System gebaut. `index.html` kann direkt im Browser geoeffnet werden.

Optional per lokalem Server:

```powershell
python -m http.server 5173
```

Dann `http://localhost:5173` oeffnen.

## Struktur

- `index.html` - Einstiegspunkt
- `styles.css` - Retro-Screendesign
- `curves.js` - Wirkungsfunktionen nach den Referenzkurven
- `app.js` - Spielzustand, Rundenlogik und Rendering
- `assets/images/` - Spielgrafiken
- `referenzbilder/` - bereitgestellte Vorlagen und Kurven

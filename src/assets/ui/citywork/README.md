# Stadtarbeit UI-Assets

Drop-in-Ordner für das Stadtarbeit-Redesign 4.0. `src/assets/registry.ts`
findet Bilder rekursiv und stellt sie über `uiImage(<Dateiname ohne Endung>)`
bereit. Fehlende Dateien führen nie zu einem Absturz; Komponenten zeigen ihren
Code-/Icon-Fallback.

Verbindlich: PNG oder WebP, transparente Fläche, keine Schrift, klare Silhouette,
maritimes Navy/Gold mit funktionsbezogenen Akzentfarben. KI-Originale liegen im
Codex-Generierungsordner der Session; nur die bereinigten Laufzeitdateien gehören
ins Projekt.

Unterordner: `markers`, `cargo`, `advisors`, `missions`, `map`, `vehicles`,
`tutorial`.

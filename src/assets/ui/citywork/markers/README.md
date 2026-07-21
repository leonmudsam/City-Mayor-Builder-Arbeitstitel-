# Kartenmarker

512×512 PNG, transparenter Hintergrund. Aktuell nutzt die Planung Quelle und
Lieferziel direkt; Nachfüllen wird zusätzlich durch Stopptyp, Beschriftung und
orange Routenetappe gezeigt. Die übrigen Marker sind vorbereitete Drop-ins für
kanonische Depot-, Zwischenlager-, Rückwaren- und Optionslogik.

| Datei | Bedeutung |
| --- | --- |
| `marker_source.png` | aktive Quelle/Start |
| `marker_delivery.png` | Pflicht-Lieferziel |
| `marker_resupply.png` | erneute Beladung |
| `marker_warehouse.png` | Zwischenlager/Hub |
| `marker_depot.png` | Fahrzeugdepot/Endpunkt |
| `marker_return_cargo.png` | Rückware |
| `marker_optional.png` | optionales Ziel |
| `marker_blocked.png` | blockierter Abschnitt |

Generierungsmodus: `stylized-concept`. Promptbasis: „Premium city-builder map
marker, single centered shield/pin silhouette, unique physical symbol for the
named logistics function, maritime navy and warm gold trim, readable at small
HUD size, no text, no letters, isolated on flat #ff00ff chroma background.“
Danach automatische Randfarbenerkennung, Soft-Matte und Despill; Alpha geprüft.

# Upload-server (web stránka)

Tento projekt je hotová **web stránka** použiteľná na **GitHub Pages**.

## Ako to funguje

- hlavná stránka je `index.html`,
- prihlásenie je cez kľúč `T4B-Q7L`,
- po prihlásení sa zobrazí profil `Profil 1` a číslo `071`,
- môžeš nahrať súbor + pridať popis,
- súbor sa uloží v prehliadači (localStorage),
- vieš ho zo zoznamu stiahnuť alebo zmazať,
- je dostupné odhlásenie.

> Poznámka: GitHub Pages nepodporuje Python backend, preto je logika v JavaScripte.

## Súbory

- `index.html` – štruktúra stránky,
- `styles.css` – dizajn,
- `app.js` – logika prihlasovania, uploadu a zoznamu.

## Lokálne spustenie

```bash
python3 -m http.server 8080
```

Potom otvor:

- `http://localhost:8080/index.html`

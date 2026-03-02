# Upload-server (GitHub Pages verzia)

Tento projekt je upravený tak, aby fungoval na **GitHub Pages** ako statická web stránka.

## Dôležité

GitHub Pages nepodporuje Python backend (`server.py`), preto:

- prihlasovanie funguje v prehliadači,
- nahraté súbory sa ukladajú do **localStorage** (lokálne v tvojom prehliadači),
- súbory nie sú zdieľané medzi používateľmi ani zariadeniami.

## Hlavná stránka

- `index.html` (to je vstupná stránka pre GitHub Pages)

## Prihlásenie

- Prístupový kľúč: `T4B-Q7L`
- Profil: `Profil 1`
- Číslo v hornom rohu po prihlásení: `071`

## Lokálne spustenie (ako statický web)

```bash
python3 -m http.server 8080
```

Potom otvor:

- `http://localhost:8080/index.html`

## Súbory

- `index.html` – UI stránky,
- `styles.css` – štýly,
- `app.js` – logika prihlasovania, uploadu a zoznamu súborov.

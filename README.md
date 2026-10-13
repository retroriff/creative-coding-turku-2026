# Creative Coding Finland / Turku Meetup

Flyer web de l'esdeveniment del 14.11.2026 a Fuusio, Turku. La versió publicada és a [GitHub Pages](https://retroriff.github.io/creative-coding-turku-2026/).

## Executar-lo en local

Cal tenir Python 3. Des de la carpeta del repositori:

```sh
cd ~/Sites/creative-coding-turku-2026
python3 -m http.server 8000
```

Obre <http://localhost:8000/> al navegador. Per aturar el servidor, prem `Ctrl+C` al terminal.

No cal instal·lar paquets ni compilar res. La pàgina carrega Hydra i CodeMirror des d'Internet, així que cal connexió per veure l'animació i l'aspecte de l'editor.

## Modificar el flyer

- `index.html`: text visible de l'esdeveniment i codi Hydra que es mostra al flyer.
- `app.js`: codi Hydra que genera l'animació. Si canvies l'animació, actualitza també el codi visible a `index.html` perquè coincideixin.
- `styles.css`: disseny i adaptació a mòbil.

En pujar els canvis a la branca `main`, GitHub Actions actualitza automàticament la pàgina de GitHub Pages.

# Creative Coding Finland / Turku Meetup

Web flyer for the event on 14 November 2026 at Fuusio in Turku. The published version is available on [GitHub Pages](https://retroriff.github.io/creative-coding-turku-2026/).

## Run locally

You need Python 3. From the repository directory, run:

```sh
cd ~/Sites/creative-coding-turku-2026
python3 -m http.server 8000
```

Open <http://localhost:8000/> in your browser. Press `Ctrl+C` in the terminal to stop the server.

No packages or build step are needed. The page loads Hydra, three.js and CodeMirror from the internet, so you need a connection to see the animation and editor styling.

## Edit the flyer

- `index.html`: visible event details and the editable code shown on the flyer. The `crystal({ ... })` values update live as you move the mouse.
- `crystal.js`: the three.js crystal, rendered into Hydra as `s0`, plus the mouse controls and live editor.
- `waves/`: the previous Hydra-only animation, kept as a separate page at `/waves/`.
- `styles.css`: layout and mobile styling, shared by both pages.
- `og-image.jpg`: social preview image linked from the Open Graph and Twitter metadata in `index.html`.
- `og-card.html` and `og-background.png`: the editable layout and Hydra background used to make the social preview image.

Pushing changes to the `main` branch automatically updates the GitHub Pages site through GitHub Actions.

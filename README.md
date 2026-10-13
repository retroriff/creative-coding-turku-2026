# Creative Coding Finland / Turku Meetup

Web flyer for the event on 14 November 2026 at Fuusio in Turku. The published version is available on [GitHub Pages](https://retroriff.github.io/creative-coding-turku-2026/).

## Run locally

You need Python 3. From the repository directory, run:

```sh
cd ~/Sites/creative-coding-turku-2026
python3 -m http.server 8000
```

Open <http://localhost:8000/> in your browser. Press `Ctrl+C` in the terminal to stop the server.

No packages or build step are needed. The page loads Hydra and CodeMirror from the internet, so you need a connection to see the animation and editor styling.

## Edit the flyer

- `index.html`: visible event details and the Hydra code shown on the flyer.
- `app.js`: Hydra code that generates the animation. If you change the animation, update the visible code in `index.html` to match.
- `styles.css`: layout and mobile styling.
- `og-image.jpg`: social preview image linked from the Open Graph and Twitter metadata in `index.html`.
- `og-card.html` and `og-background.png`: the editable layout and Hydra background used to make the social preview image.

Pushing changes to the `main` branch automatically updates the GitHub Pages site through GitHub Actions.

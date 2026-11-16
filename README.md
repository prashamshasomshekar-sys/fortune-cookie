# Retro Fortune Cookie

A 3D fortune cookie with a retro anime look. Click it and it cracks open. The saying and your lucky numbers are printed on the paper slip that slides out.

**Live link:** https://prashamshasomshekar-sys.github.io/fortune-cookie/

## How to use

1. Open the live link.
2. Click the cookie. It shakes, cracks, and drops crumbs, and a note floats out with your fortune.
3. Click again to close the cookie and get a new fortune.

## What's in it

- A 3D folded cookie with flat cartoon shading and black ink outlines
- A neon sunset with a striped sun, stars, and a moving grid floor
- Old-TV scanlines and film grain over everything
- A comic-style "CRACK!" pop with burst lines and flying crumbs
- Fortunes and lucky numbers printed on the 3D paper slip

## Files

| File | What it does |
| --- | --- |
| `index.html` | The page itself. It loads the other two files. |
| `style.css` | The background, sun, grid, TV effect, and lettering. |
| `script.js` | The 3D cookie, the crack animation, the note, and the list of sayings. |

## Run it on your computer

Download or clone the repo, keep the three files together, and open `index.html` in a browser. It needs an internet connection to load the 3D library ([Three.js](https://threejs.org/)) and the fonts.

If the cookie doesn't show up when you double-click the file, serve the folder instead:

```bash
npx http-server .
```

Then open the address it prints.

## Change the fortunes

Edit the `fortunes` list in `script.js`. Each saying is one line of text in quotes. Long sayings shrink to fit on the slip, up to three lines.

## Built with

- [Three.js](https://threejs.org/) for the 3D cookie
- Google Fonts: Bungee and VT323

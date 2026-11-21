# StudyTool

A simple study site for practising with AI-generated MCQs, flashcards, and short Q&A. Built with plain HTML, CSS, JavaScript, and Alpine.js (self-hosted, no build step).

## Two ways to use it

- **Your own questions:** open MCQ Quiz, Flashcards, or Short Q&A, paste JSON from an AI, and practise.
- **Practice tests:** pick a ready-made test from the menu (or the Practice Tests tab). It opens straight away, with no pasting.

## Project structure

```
index.html            page layout
style.css             styles
app.js                app logic
library.json          list of practice tests
js/alpine.min.js      Alpine.js (local copy)
mcqs/                 MCQ test files
flashcards/           flashcard test files
question-answers/     short Q&A test files
```

## Publishing a practice test

1. Create the JSON file in the matching folder, for example `mcqs/os2.json`.
2. Add one entry to `library.json`:

```json
{ "title": "MCQs - OS2", "type": "mcq", "file": "mcqs/os2.json" }
```

3. Commit and push. The test appears in the menu.

| type | folder | file format |
|---|---|---|
| `mcq` | `mcqs/` | `[{"question":"...","options":["A","B"],"answer":"A"}]` |
| `flashcards` | `flashcards/` | `[{"front":"...","back":"..."}]` |
| `qa` | `question-answers/` | `[{"question":"..."}]` |

Notes:
- `file` is the path from the project root, so it must match where the file actually is.
- `title` is what students see in the menu, so include the type and subject (e.g. "Flashcards - OS2").
- For MCQs, `answer` must exactly match one of the `options`.
- Add a comma between entries in `library.json`, and keep it valid JSON.

## Running locally

Practice tests are loaded with `fetch`, so open the site through a local server, not by double-clicking `index.html`:

```
python -m http.server
```

Then open `http://localhost:8000`.

## Deploying

Push to GitHub and serve the repo with GitHub Pages. No build step is needed.

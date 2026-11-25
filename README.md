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

## File formats

**MCQ** (`type: "mcq"`, folder `mcqs/`)

```json
[
  {
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "answer": 1
  }
]
```

`answer` is the number of the correct option, starting at 1 (1 = first option).

**Flashcards** (`type: "flashcards"`, folder `flashcards/`)

```json
[
  { "front": "Term", "back": "Definition" }
]
```

**Short Q&A** (`type: "qa"`, folder `question-answers/`)

```json
[
  { "question": "What is ...?", "ai_answer": "A short, clear answer" }
]
```

`ai_answer` is optional. When questions have it, finishing the test shows a review: the user's answer (green) next to the AI generated answer (gray). Without it, the test just produces the output to paste into an AI for grading.

## Notes

- `file` is the path from the project root and must match where the file actually is.
- `title` is what students see in the menu, so include the type and subject (e.g. "Flashcards - OS2").
- Add a comma between entries in `library.json` and keep it valid JSON.
- Drafts: keep unfinished tests in a local-only file such as `library-drafts.json` and add that name to `.gitignore` so it is never pushed. Copy an entry into `library.json` when the test is ready.
- Everything in the repo is public on GitHub Pages, so don't put anything private in it.

## Running locally

Practice tests are loaded with `fetch`, so open the site through a local server, not by double-clicking `index.html`:

```
python -m http.server
```

Then open `http://localhost:8000`.

## Deploying

Push to GitHub and serve the repo with GitHub Pages. No build step is needed.

// ============ VALIDATION (shared by pasted JSON and published tests) ============
function validateMcq(data) {
    if (!Array.isArray(data)) throw new Error('Data must be an array.');
    if (data.length === 0) throw new Error('The list is empty.');
    data.forEach((item, i) => {
        if (!item.question || !item.options || !item.answer) {
            throw new Error(`Item ${i + 1} missing "question", "options", or "answer".`);
        }
        if (!Array.isArray(item.options) || item.options.length < 2) {
            throw new Error(`Item ${i + 1} "options" must be an array with at least 2 choices.`);
        }
        if (!item.options.includes(item.answer)) {
            throw new Error(`Item ${i + 1} "answer" must be one of the options.`);
        }
    });
    return data;
}

function validateFlashcards(data) {
    if (!Array.isArray(data)) throw new Error('Data must be an array.');
    if (data.length === 0) throw new Error('The list is empty.');
    data.forEach((item, i) => {
        if (!item.front || !item.back) {
            throw new Error(`Item ${i + 1} missing "front" or "back".`);
        }
    });
    return data;
}

function validateQa(data) {
    if (!Array.isArray(data)) throw new Error('Data must be an array.');
    if (data.length === 0) throw new Error('The list is empty.');
    data.forEach((item, i) => {
        if (!item.question) {
            throw new Error(`Item ${i + 1} missing "question".`);
        }
    });
    return data;
}

const VALIDATORS = { mcq: validateMcq, flashcards: validateFlashcards, qa: validateQa };
const KIND_LABELS = { mcq: 'MCQ', flashcards: 'Flashcards', qa: 'Short Q&A' };
const QA_INSTRUCTION = "Review the user's answers. Mark each as correct/incorrect. If incorrect, provide the correct answer or a brief explanation.";

function serverHint() {
    return location.protocol === 'file:'
        ? ' Published tests need the site to be served over http(s), not opened by double-clicking the file.'
        : '';
}

// ============ APP ============
document.addEventListener('alpine:init', () => {
    Alpine.data('app', () => {
    let libraryPromise = null; // kept outside reactive state
    return {
        // navigation
        route: 'home',
        testFile: null,
        menuOpen: false,

        // library of published tests
        library: [],
        libraryState: 'loading', // loading | ready | error
        libraryError: '',
        _loadToken: 0,

        // currently opened published test
        test: { title: '', type: null, state: 'idle', error: '' },

        // MCQ
        mcq: { input: '', error: '', questions: [], answers: [], checked: false, score: 0, source: null },

        // Flashcards
        fc: { input: '', error: '', cards: [], index: 0, flipped: false, source: null },

        // Short Q&A
        qa: { input: '', error: '', questions: [], answers: [], index: 0, finished: false, output: '', copyMsg: '', source: null },

        // ---------- init ----------
        init() {
            libraryPromise = this.loadLibrary();
            window.addEventListener('hashchange', () => this.handleRoute());
            this.handleRoute();
        },

        async loadLibrary() {
            this.libraryState = 'loading';
            try {
                const res = await fetch('library.json', { cache: 'no-cache' });
                if (!res.ok) throw new Error(`library.json returned ${res.status}.`);
                const data = await res.json();
                if (!Array.isArray(data)) throw new Error('library.json must be an array.');
                this.library = data.filter(t => t && t.title && t.file && VALIDATORS[t.type]);
                this.libraryState = 'ready';
            } catch (e) {
                this.libraryError = e.message + serverHint();
                this.libraryState = 'error';
            }
        },

        // ---------- routing ----------
        handleRoute() {
            const hash = location.hash.replace(/^#\/?/, '');
            const [page, ...rest] = hash.split('/');
            this.menuOpen = false;
            window.scrollTo(0, 0);

            if (page === 'test' && rest.length) {
                this.route = 'test';
                this.testFile = decodeURIComponent(rest.join('/'));
                this.openTest(this.testFile);
                return;
            }

            this._loadToken++; // cancel any test still loading
            this.testFile = null;
            this.test = { title: '', type: null, state: 'idle', error: '' };

            const pages = ['home', 'mcq', 'flashcards', 'qa', 'library'];
            this.route = pages.includes(page) ? page : 'home';

            // switching back to a paste page: clear anything left over from a published test
            if (this.route === 'mcq' && this.mcq.source !== 'paste') this.clearMcq();
            if (this.route === 'flashcards' && this.fc.source !== 'paste') this.clearFlashcards();
            if (this.route === 'qa' && this.qa.source !== 'paste') this.clearQa();
        },

        testHref(t) {
            return '#/test/' + encodeURIComponent(t.file);
        },

        kindLabel(type) {
            return KIND_LABELS[type] || type;
        },

        // which type section is visible
        showType(type) {
            return this.route === type || (this.route === 'test' && this.test.type === type);
        },

        // ---------- published tests ----------
        async openTest(file) {
            const token = ++this._loadToken;
            this.test = { title: '', type: null, state: 'loading', error: '' };
            this.clearMcq(); this.clearFlashcards(); this.clearQa();

            await libraryPromise;
            if (token !== this._loadToken) return;

            const entry = this.library.find(t => t.file === file);
            if (!entry) {
                this.test = {
                    title: 'Test not found', type: null, state: 'error',
                    error: this.libraryState === 'error'
                        ? this.libraryError
                        : 'This test is not in the published list.'
                };
                return;
            }

            this.test = { title: entry.title, type: entry.type, state: 'loading', error: '' };

            try {
                const res = await fetch(entry.file, { cache: 'no-cache' });
                if (!res.ok) throw new Error(`${entry.file} returned ${res.status}.`);
                const data = VALIDATORS[entry.type](await res.json());
                if (token !== this._loadToken) return;

                if (entry.type === 'mcq') this.loadMcq(data, entry.file);
                if (entry.type === 'flashcards') this.loadFlashcards(data, entry.file);
                if (entry.type === 'qa') this.loadQa(data, entry.file);
                this.test.state = 'ready';
            } catch (e) {
                if (token !== this._loadToken) return;
                this.test.state = 'error';
                this.test.error = e.message + serverHint();
            }
        },

        // ---------- clipboard ----------
        async copyText(text) {
            try {
                await navigator.clipboard.writeText(text);
            } catch (e) {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            }
        },

        // ============ MCQ ============
        clearMcq() {
            this.mcq.questions = []; this.mcq.answers = [];
            this.mcq.checked = false; this.mcq.score = 0;
            this.mcq.error = ''; this.mcq.source = null;
        },

        loadMcq(data, source) {
            this.mcq.questions = data;
            this.mcq.answers = new Array(data.length).fill(null);
            this.mcq.checked = false;
            this.mcq.score = 0;
            this.mcq.error = '';
            this.mcq.source = source;
        },

        generateMcq() {
            try {
                const data = validateMcq(JSON.parse(this.mcq.input.trim()));
                this.loadMcq(data, 'paste');
            } catch (e) {
                this.clearMcq();
                this.mcq.error = e.message;
            }
        },

        checkMcq() {
            let score = 0;
            this.mcq.questions.forEach((q, i) => {
                if (this.mcq.answers[i] === q.answer) score++;
            });
            this.mcq.score = score;
            this.mcq.checked = true;
        },

        retakeMcq() {
            this.mcq.answers = new Array(this.mcq.questions.length).fill(null);
            this.mcq.checked = false;
            this.mcq.score = 0;
            window.scrollTo(0, 0);
        },

        optionClass(q, i, opt) {
            if (!this.mcq.checked) return '';
            if (opt === q.answer) return 'correct';
            if (this.mcq.answers[i] === opt) return 'wrong';
            return '';
        },

        feedbackClass(q, i) {
            return this.mcq.answers[i] === q.answer ? 'result-correct' : 'result-wrong';
        },

        feedbackText(q, i) {
            const picked = this.mcq.answers[i];
            if (picked === null || picked === undefined) return `⚠️ No answer selected. Correct answer: ${q.answer}`;
            return picked === q.answer
                ? `✅ Correct! (Answer: ${q.answer})`
                : `❌ Wrong. Correct answer: ${q.answer}`;
        },

        // ============ FLASHCARDS ============
        clearFlashcards() {
            this.fc.cards = []; this.fc.index = 0; this.fc.flipped = false;
            this.fc.error = ''; this.fc.source = null;
        },

        loadFlashcards(data, source) {
            this.fc.cards = data;
            this.fc.index = 0;
            this.fc.flipped = false;
            this.fc.error = '';
            this.fc.source = source;
        },

        generateFlashcards() {
            try {
                const data = validateFlashcards(JSON.parse(this.fc.input.trim()));
                this.loadFlashcards(data, 'paste');
            } catch (e) {
                this.clearFlashcards();
                this.fc.error = e.message;
            }
        },

        fcMove(step) {
            const n = this.fc.cards.length;
            if (!n) return;
            const wasFlipped = this.fc.flipped;
            this.fc.flipped = false;
            const change = () => { this.fc.index = (this.fc.index + step + n) % n; };
            // let the card flip back before the text changes, so the answer isn't revealed
            wasFlipped ? setTimeout(change, 200) : change();
        },

        // ============ SHORT Q&A ============
        clearQa() {
            this.qa.questions = []; this.qa.answers = []; this.qa.index = 0;
            this.qa.finished = false; this.qa.output = ''; this.qa.copyMsg = '';
            this.qa.error = ''; this.qa.source = null;
        },

        loadQa(data, source) {
            this.qa.questions = data;
            this.qa.answers = new Array(data.length).fill('');
            this.qa.index = 0;
            this.qa.finished = false;
            this.qa.output = '';
            this.qa.copyMsg = '';
            this.qa.error = '';
            this.qa.source = source;
        },

        startQa() {
            try {
                const data = validateQa(JSON.parse(this.qa.input.trim()));
                this.loadQa(data, 'paste');
            } catch (e) {
                this.clearQa();
                this.qa.error = e.message;
            }
        },

        finishQa() {
            const qaPairs = this.qa.questions.map((q, i) => ({
                question: q.question,
                user_answer: this.qa.answers[i] || ''
            }));
            this.qa.output = JSON.stringify({ instruction: QA_INSTRUCTION, qa_pairs: qaPairs }, null, 2);
            this.qa.finished = true;
            this.qa.copyMsg = '';
        },

        resetQa() {
            if (this.route === 'test') {
                // published test: restart from the first question
                this.loadQa(this.qa.questions, this.qa.source);
            } else {
                this.clearQa();
            }
            window.scrollTo(0, 0);
        },

        async copyQaOutput() {
            if (!this.qa.output) {
                this.qa.copyMsg = 'Nothing to copy yet.';
                return;
            }
            await this.copyText(this.qa.output);
            this.qa.copyMsg = '✅ Copied to clipboard!';
        }
    };
    });
});

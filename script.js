// ============ NAVIGATION ============
const navLinks = document.querySelectorAll('nav a');
const pageIds = ['page-home', 'page-mcq', 'page-flashcards', 'page-qa'];

navLinks.forEach(link =>
{
    link.addEventListener('click', () =>
    {
        const pageId = link.dataset.page;
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        pageIds.forEach(id =>
        {
            document.getElementById(id).classList.remove('active');
        });
        document.getElementById(pageId).classList.add('active');
        // reset flashcard flip state when leaving
        if (pageId !== 'page-flashcards')
        {
            const fc = document.getElementById('flashcard-display');
            if (fc) fc.classList.remove('flipped');
        }
    });
});

// ============ MCQ LOGIC ============
const mcqInput = document.getElementById('mcq-input');
const generateBtn = document.getElementById('generate-mcq');
const mcqError = document.getElementById('mcq-error');
const quizArea = document.getElementById('mcq-quiz-area');
const questionsContainer = document.getElementById('mcq-questions-container');
const submitArea = document.getElementById('mcq-submit-area');
const submitBtn = document.getElementById('submit-mcq');
const resultsDiv = document.getElementById('mcq-results');
let currentMcqData = [];

function renderMcq(questions)
{
    questionsContainer.innerHTML = '';
    if (!questions || questions.length === 0)
    {
        quizArea.style.display = 'none';
        return;
    }
    currentMcqData = questions;
    quizArea.style.display = 'block';
    submitArea.style.display = 'block';
    resultsDiv.style.display = 'none';

    questions.forEach((q, idx) =>
    {
        const block = document.createElement('div');
        block.className = 'question-block';
        block.dataset.index = idx;
        const qText = document.createElement('div');
        qText.className = 'q-text';
        qText.textContent = `${idx + 1}. ${q.question}`;
        block.appendChild(qText);

        const optsDiv = document.createElement('div');
        optsDiv.className = 'options';
        q.options.forEach(opt =>
        {
            const label = document.createElement('label');
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = `mcq-${idx}`;
            radio.value = opt;
            label.appendChild(radio);
            label.appendChild(document.createTextNode(' ' + opt));
            optsDiv.appendChild(label);
        });
        block.appendChild(optsDiv);

        const resultP = document.createElement('div');
        resultP.id = `mcq-result-${idx}`;
        resultP.style.marginTop = '0.5rem';
        block.appendChild(resultP);
        questionsContainer.appendChild(block);
    });
}

generateBtn.addEventListener('click', () =>
{
    const raw = mcqInput.value.trim();
    mcqError.textContent = '';
    try
    {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) throw new Error('Data must be an array.');
        parsed.forEach((item, i) =>
        {
            if (!item.question || !item.options || !item.answer)
            {
                throw new Error(`Item ${i + 1} missing "question", "options", or "answer".`);
            }
            if (!Array.isArray(item.options) || item.options.length < 2)
            {
                throw new Error(`Item ${i + 1} "options" must be an array with at least 2 choices.`);
            }
            if (!item.options.includes(item.answer))
            {
                throw new Error(`Item ${i + 1} "answer" must be one of the options.`);
            }
        });
        renderMcq(parsed);
    } catch (e)
    {
        mcqError.textContent = '❌ ' + e.message;
        quizArea.style.display = 'none';
    }
});

submitBtn.addEventListener('click', () =>
{
    const questions = currentMcqData;
    if (!questions || questions.length === 0) return;
    let correctCount = 0;
    questions.forEach((q, idx) =>
    {
        const selected = document.querySelector(`input[name="mcq-${idx}"]:checked`);
        const resultEl = document.getElementById(`mcq-result-${idx}`);
        if (!selected)
        {
            resultEl.innerHTML = '⚠️ No answer selected.';
            resultEl.className = 'result-wrong';
            return;
        }
        const userAns = selected.value;
        const isCorrect = userAns === q.answer;
        if (isCorrect) correctCount++;
        resultEl.innerHTML = isCorrect
            ? `✅ Correct! (Answer: ${q.answer})`
            : `❌ Wrong. Correct answer: ${q.answer}`;
        resultEl.className = isCorrect ? 'result-correct' : 'result-wrong';
    });
    const total = questions.length;
    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = `
    <div class="result-stats">
      <strong>Score: ${correctCount} / ${total}</strong>
      (${Math.round((correctCount / total) * 100)}%)
    </div>
  `;
    submitArea.style.display = 'none';
});

// ============ FLASHCARD LOGIC ============
const flashcardInput = document.getElementById('flashcard-input');
const generateFcBtn = document.getElementById('generate-flashcards');
const fcError = document.getElementById('flashcard-error');
const fcArea = document.getElementById('flashcard-area');
const fcDisplay = document.getElementById('flashcard-display');
const fcFront = document.getElementById('fc-front');
const fcBack = document.getElementById('fc-back');
const fcCounter = document.getElementById('fc-counter');
const fcPrev = document.getElementById('fc-prev');
const fcNext = document.getElementById('fc-next');
const fcFlip = document.getElementById('fc-flip');

let flashcards = [];
let currentFcIndex = 0;
let isFlipped = false;

function updateFlashcard()
{
    if (!flashcards.length)
    {
        fcArea.style.display = 'none';
        return;
    }
    fcArea.style.display = 'block';
    const card = flashcards[currentFcIndex];
    fcFront.textContent = card.front || 'Front';
    fcBack.textContent = card.back || 'Back';
    fcCounter.textContent = `${currentFcIndex + 1} / ${flashcards.length}`;
    if (isFlipped)
    {
        isFlipped = false;
        fcDisplay.classList.remove('flipped');
    }
}

generateFcBtn.addEventListener('click', () =>
{
    const raw = flashcardInput.value.trim();
    fcError.textContent = '';
    try
    {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) throw new Error('Data must be an array.');
        parsed.forEach((item, i) =>
        {
            if (!item.front || !item.back)
            {
                throw new Error(`Item ${i + 1} missing "front" or "back".`);
            }
        });
        flashcards = parsed;
        currentFcIndex = 0;
        isFlipped = false;
        updateFlashcard();
    } catch (e)
    {
        fcError.textContent = '❌ ' + e.message;
        fcArea.style.display = 'none';
    }
});

fcPrev.addEventListener('click', () =>
{
    if (!flashcards.length) return;
    currentFcIndex = (currentFcIndex - 1 + flashcards.length) % flashcards.length;
    updateFlashcard();
});
fcNext.addEventListener('click', () =>
{
    if (!flashcards.length) return;
    currentFcIndex = (currentFcIndex + 1) % flashcards.length;
    updateFlashcard();
});
fcFlip.addEventListener('click', () =>
{
    if (!flashcards.length) return;
    isFlipped = !isFlipped;
    fcDisplay.classList.toggle('flipped');
});
fcDisplay.addEventListener('click', () =>
{
    if (!flashcards.length) return;
    isFlipped = !isFlipped;
    fcDisplay.classList.toggle('flipped');
});

// ============ SHORT Q&A LOGIC (PAGE 4) ============
const qaInput = document.getElementById('qa-input');
const startQaBtn = document.getElementById('start-qa');
const qaError = document.getElementById('qa-error');
const qaSession = document.getElementById('qa-session');
const qaProgress = document.getElementById('qa-progress');
const qaStatus = document.getElementById('qa-status');
const qaQuestionDisplay = document.getElementById('qa-question-display');
const qaAnswerInput = document.getElementById('qa-answer-input');
const qaPrevBtn = document.getElementById('qa-prev');
const qaNextBtn = document.getElementById('qa-next');
const qaFinishBtn = document.getElementById('qa-finish');
const qaOutputArea = document.getElementById('qa-output-area');
const qaOutput = document.getElementById('qa-output');
const qaCopyBtn = document.getElementById('qa-copy-btn');
const qaResetBtn = document.getElementById('qa-reset-btn');
const qaCopyMsg = document.getElementById('qa-copy-msg');

let qaQuestions = [];
let qaAnswers = [];
let qaCurrentIdx = 0;
let qaFinished = false;

function renderQA()
{
    if (!qaQuestions.length) return;
    const total = qaQuestions.length;
    qaProgress.textContent = `Question ${qaCurrentIdx + 1} / ${total}`;
    qaQuestionDisplay.textContent = qaQuestions[qaCurrentIdx].question;
    qaAnswerInput.value = qaAnswers[qaCurrentIdx] || '';

    // Update button visibility
    qaPrevBtn.style.display = qaCurrentIdx === 0 ? 'none' : 'inline-block';
    if (qaCurrentIdx === total - 1)
    {
        qaNextBtn.style.display = 'none';
        qaFinishBtn.style.display = 'inline-block';
        qaStatus.textContent = 'Last question – click Finish when done.';
    } else
    {
        qaNextBtn.style.display = 'inline-block';
        qaFinishBtn.style.display = 'none';
        qaStatus.textContent = `Question ${qaCurrentIdx + 1} of ${total}`;
    }
    qaAnswerInput.focus();
}

function saveCurrentAnswer()
{
    if (qaQuestions.length)
    {
        qaAnswers[qaCurrentIdx] = qaAnswerInput.value;
    }
}

startQaBtn.addEventListener('click', () =>
{
    const raw = qaInput.value.trim();
    qaError.textContent = '';
    qaOutputArea.style.display = 'none';
    qaFinished = false;
    try
    {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) throw new Error('Data must be an array.');
        parsed.forEach((item, i) =>
        {
            if (!item.question)
            {
                throw new Error(`Item ${i + 1} missing "question".`);
            }
        });
        qaQuestions = parsed;
        qaAnswers = new Array(qaQuestions.length).fill('');
        qaCurrentIdx = 0;
        qaSession.style.display = 'block';
        renderQA();
    } catch (e)
    {
        qaError.textContent = '❌ ' + e.message;
        qaSession.style.display = 'none';
    }
});

qaPrevBtn.addEventListener('click', () =>
{
    if (qaCurrentIdx > 0)
    {
        saveCurrentAnswer();
        qaCurrentIdx--;
        renderQA();
    }
});

qaNextBtn.addEventListener('click', () =>
{
    if (qaCurrentIdx < qaQuestions.length - 1)
    {
        saveCurrentAnswer();
        qaCurrentIdx++;
        renderQA();
    }
});

qaFinishBtn.addEventListener('click', () =>
{
    saveCurrentAnswer();
    qaFinished = true;
    // Build output
    const instruction = "Review the user's answers. Mark each as correct/incorrect. If incorrect, provide the correct answer or a brief explanation.";
    const qaPairs = qaQuestions.map((q, idx) => ({
        question: q.question,
        user_answer: qaAnswers[idx] || ''
    }));
    const outputObj = {
        instruction: instruction,
        qa_pairs: qaPairs
    };
    qaOutput.value = JSON.stringify(outputObj, null, 2);
    qaOutputArea.style.display = 'block';
    qaSession.style.display = 'none';
    qaCopyMsg.textContent = '';
});

qaResetBtn.addEventListener('click', () =>
{
    qaOutputArea.style.display = 'none';
    qaSession.style.display = 'none';
    qaQuestions = [];
    qaAnswers = [];
    qaCurrentIdx = 0;
    qaFinished = false;
    qaError.textContent = '';
    qaOutput.value = '';
    qaCopyMsg.textContent = '';
});

qaCopyBtn.addEventListener('click', () =>
{
    const text = qaOutput.value;
    if (!text)
    {
        qaCopyMsg.textContent = 'Nothing to copy yet.';
        return;
    }
    navigator.clipboard.writeText(text).then(() =>
    {
        qaCopyMsg.textContent = '✅ Copied to clipboard!';
    }).catch(() =>
    {
        // fallback
        qaOutput.select();
        document.execCommand('copy');
        qaCopyMsg.textContent = '✅ Copied!';
    });
});

// ============ AUTO‑GENERATE SAMPLE DATA ON LOAD ============
window.addEventListener('load', () =>
{
    generateBtn.click();
    generateFcBtn.click();
});
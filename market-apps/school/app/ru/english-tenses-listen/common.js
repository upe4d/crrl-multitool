"use strict";
// Shared code of the English phrase lessons. The build keeps this file and the lesson's mode file (speak.ts,
// assemble.ts…): they are classic scripts sharing one global scope, each mode wrapped in a namespace.
const T = typeof GAME_DATA === "undefined" ? {} : GAME_DATA.text;
/** A text with its «{name}» parts filled: fill(T.topicDone, { name: "Еда" }). */
const fill = (text, values) => text.replace(/\{(\w+)\}/g, (part, key) => (key in values ? String(values[key]) : part));
const MAX_SOUND_MS = 8000;
const NEW_ITEM_CHANCE = 0.75; // how often to prefer an item that hasn't been done right yet
const HINT_AFTER_MISSES = 2; // nudge towards 💡 after this many tries
const $ = (id) => document.getElementById(id);
const random = (list) => list[Math.floor(Math.random() * list.length)];
function shuffle(list) {
    const out = [...list];
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}
function bump(el) {
    el.classList.remove("bump");
    void el.offsetWidth; // restart the animation
    el.classList.add("bump");
}
// ---------- Saved progress ----------
let store = "";
function load(key, fallback) {
    try {
        const raw = localStorage.getItem(`${store}:${key}`);
        return raw ? JSON.parse(raw) : fallback;
    }
    catch {
        return fallback;
    }
}
function save(key, value) {
    try {
        localStorage.setItem(`${store}:${key}`, JSON.stringify(value));
    }
    catch {
        // Private mode or blocked storage: progress lives until the page is closed
    }
}
// ---------- Topics, score and progress ----------
let topics = [];
let topicIndex = 0;
let score = 0;
let learned = new Set(); // items done right without a hint at least once (slugs)
const seen = new Map(); // per topic: items shown since the last full cycle
let touched = false; // the page got a click or a key: from now on sounds may start by themselves
let onTopicChange = () => { }; // the mode's newRound
const currentTopic = () => topics[topicIndex];
const learnedIn = (topic) => topic.items.filter((p) => learned.has(p.slug)).length;
/** Items in rotation: no repeats until the whole topic has been shown; new items come up more often. */
function pickItem(previous) {
    const topic = currentTopic();
    const recent = seen.get(topic.key) ?? new Set();
    seen.set(topic.key, recent);
    let fresh = topic.items.filter((p) => !recent.has(p.slug) && p !== previous);
    if (!fresh.length) {
        recent.clear();
        fresh = topic.items.filter((p) => p !== previous);
    }
    if (!fresh.length)
        fresh = topic.items;
    const unlearned = fresh.filter((p) => !learned.has(p.slug));
    const next = random(unlearned.length && Math.random() < NEW_ITEM_CHANCE ? unlearned : fresh);
    recent.add(next.slug);
    return next;
}
function setTopic(index) {
    topicIndex = index;
    save("topic", currentTopic().key);
    onTopicChange();
}
/**
 * A right answer: ⭐ +1 always, the item counts in the topic progress only without a hint.
 * Returns true when this answer completed the topic (the caller shows the dialog after its own effects).
 */
function scoreItem(item, hinted) {
    score++;
    save("score", score);
    bump($("score"));
    if (hinted || learned.has(item.slug))
        return false;
    learned.add(item.slug);
    save("learned", [...learned]);
    return learnedIn(currentTopic()) === currentTopic().items.length;
}
function renderTopics() {
    const box = $("topics");
    box.replaceChildren();
    topics.forEach((topic, i) => {
        const btn = document.createElement("button");
        const done = learnedIn(topic);
        btn.className = "topic" + (i === topicIndex ? " current" : "") + (done === topic.items.length ? " done" : "");
        btn.title = topic.name;
        btn.innerHTML = `<span class="topic-icon">${topic.icon}</span><span class="topic-name">${topic.name}</span>` +
            `<span class="topic-count">${done}/${topic.items.length}</span>`;
        btn.onclick = () => setTopic(i);
        box.append(btn);
    });
    $("score").textContent = `⭐ ${score}`;
}
/** "Topic done" dialog; its button moves on to the next topic. */
function showTopicDone(text) {
    const topic = currentTopic();
    $("overlay-icon").textContent = topic.icon;
    $("overlay-title").textContent = fill(T.topicDone, { name: topic.name });
    $("overlay-text").textContent = text;
    $("overlay-btn").onclick = () => {
        $("overlay").hidden = true;
        setTopic((topicIndex + 1) % topics.length);
    };
    $("overlay").hidden = false;
    confetti();
}
// ---------- Sound ----------
let mediaBase = "";
/**
 * Shared folders are two levels up both on the site (_site/ru/<lesson>/ → _site/english-phrases/)
 * and in a local build (lessons/<lesson>/build/ → lessons/english-phrases/).
 */
function sharedBase(folder) {
    return `../../${folder}/`;
}
const audioUrl = (item) => `${mediaBase}audio/${item.slug}.mp3`;
// The translation's sound: audio/ru/ or audio/ua/ — the same folder name as the language
const trAudioUrl = (item) => `${mediaBase}audio/${GAME_DATA.lang}/${item.slug}.mp3`;
const audioCache = new Map();
let stopCurrent = null;
function audioFor(url) {
    let audio = audioCache.get(url);
    if (!audio) {
        audio = new Audio(url);
        audio.preload = "auto";
        audioCache.set(url, audio);
    }
    return audio;
}
function play(url) {
    stopSounds();
    return new Promise((resolve) => {
        const a = audioFor(url);
        // A phrase lasts a couple of seconds; if «ended» never comes (stalled load), don't leave the game hanging
        const guard = setTimeout(() => stopCurrent?.(), MAX_SOUND_MS);
        const done = () => {
            clearTimeout(guard);
            a.onended = a.onerror = null;
            stopCurrent = null;
            resolve();
        };
        stopCurrent = () => {
            a.pause();
            done();
        };
        a.onended = a.onerror = done;
        a.currentTime = 0;
        a.play().catch(done);
    });
}
const synth = window.speechSynthesis ?? null;
let nativeVoice = null;
function findNativeVoice() {
    nativeVoice = synth?.getVoices().find((v) => v.lang.replace("_", "-").toLowerCase().startsWith(T.voiceLang)) ?? null;
}
/** Reads a translation with a system voice (when it has no sound); without a voice of that language — nothing. */
function sayTranslation(text) {
    if (!synth || !nativeVoice)
        return Promise.resolve();
    stopSounds();
    return new Promise((resolve) => {
        const u = new SpeechSynthesisUtterance(text);
        u.voice = nativeVoice;
        u.lang = nativeVoice.lang;
        u.rate = 0.9;
        const guard = setTimeout(() => stopCurrent?.(), MAX_SOUND_MS);
        const done = () => {
            clearTimeout(guard);
            u.onend = u.onerror = null;
            stopCurrent = null;
            resolve();
        };
        stopCurrent = () => {
            synth.cancel();
            done();
        };
        u.onend = u.onerror = done;
        synth.speak(u);
    });
}
function stopSounds() {
    stopCurrent?.();
}
// ---------- Effects: right/wrong chime and confetti ----------
let effects = null;
/** A short synthesized tune — no extra sound files needed. */
function chime(ok) {
    effects ?? (effects = new AudioContext());
    const ctx = effects;
    const notes = ok ? [523, 659, 784, 1047] : [330, 262]; // C-E-G-C / E-C
    notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = ctx.currentTime + i * (ok ? 0.09 : 0.18);
        osc.type = ok ? "triangle" : "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(ok ? 0.25 : 0.12, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + (ok ? 0.35 : 0.3));
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.4);
    });
}
function confetti() {
    const layer = $("confetti");
    for (let i = 0; i < 28; i++) {
        const bit = document.createElement("span");
        bit.textContent = random(["⭐", "✨", "🎉", "🌟", "💬", currentTopic().icon]);
        bit.style.left = `${Math.random() * 100}%`;
        bit.style.animationDelay = `${Math.random() * 0.3}s`;
        bit.style.fontSize = `${20 + Math.random() * 22}px`;
        bit.style.setProperty("--drift", `${(Math.random() - 0.5) * 160}px`);
        layer.append(bit);
        setTimeout(() => bit.remove(), 2200);
    }
}
const speechApi = window;
const Recognizer = speechApi.SpeechRecognition ?? speechApi.webkitSpeechRecognition ?? null;
const LISTEN_MS = 12000; // stop listening after this long anyway: the child may think before answering
const QUIET_MS = 2200; // after something was heard, this much silence ends the attempt
let micBlocked = false; // no permission or no microphone — only the manual button is left
let lastError = ""; // recognizer error of the last attempt: no-speech, network…
let recognition = null;
let listenTimer = 0;
let quietTimer = 0;
const canSpeak = () => Recognizer !== null && !micBlocked;
// Without recognition (or offline) an adult listens and presses «Получилось»
const manualMode = () => !canSpeak() || lastError === "network";
const recognizing = () => recognition !== null;
/**
 * Turns the mic on. onHeard gets what is heard so far on every result; the attempt ends as soon as
 * matches() is true, after QUIET_MS of silence or after LISTEN_MS — then onEnd(matched, error).
 * Returns false if the mic could not start.
 */
function startRecognition(lang, matches, onHeard, onEnd) {
    if (!Recognizer || micBlocked)
        return false;
    stopSounds(); // the mic must not hear the speaker
    stopRecognition();
    const rec = new Recognizer();
    rec.lang = lang;
    rec.interimResults = true; // show what is heard while the child speaks
    rec.maxAlternatives = 5; // the right answer is often not the first guess for a child's voice
    rec.continuous = true; // a pause in the middle of a phrase must not end the attempt
    let matched = false;
    let error = "";
    rec.onresult = (e) => {
        const best = [];
        for (let i = 0; i < e.results.length; i++) {
            const result = e.results[i];
            best.push(result[0]?.transcript ?? "");
            for (let j = 0; j < result.length; j++)
                if (matches(result[j].transcript))
                    matched = true;
        }
        const heard = best.join(" ").replace(/\s+/g, " ").trim();
        if (matches(heard))
            matched = true; // a phrase may come as several results
        onHeard(heard);
        clearTimeout(quietTimer);
        if (matched)
            rec.stop();
        else if (heard)
            quietTimer = setTimeout(() => rec.stop(), QUIET_MS);
    };
    rec.onerror = (e) => {
        error = e.error;
    };
    rec.onend = () => {
        clearTimeout(listenTimer);
        clearTimeout(quietTimer);
        if (recognition !== rec)
            return; // stopped on purpose: another item or another attempt
        recognition = null;
        lastError = matched ? "" : error;
        if (["not-allowed", "service-not-allowed", "audio-capture"].includes(error))
            micBlocked = true;
        onEnd(matched, error);
    };
    recognition = rec;
    lastError = "";
    try {
        rec.start();
    }
    catch {
        recognition = null;
        return false;
    }
    listenTimer = setTimeout(() => rec.stop(), LISTEN_MS);
    return true;
}
/** Turns the mic off without a verdict (another item, another attempt). */
function stopRecognition() {
    const rec = recognition;
    recognition = null;
    clearTimeout(listenTimer);
    clearTimeout(quietTimer);
    rec?.abort();
}
/** 🎤 pressed while listening: the child has finished — check what was heard. */
function finishRecognition() {
    recognition?.stop();
}
/** The note under the buttons when the answer can't be checked by voice. */
function micNote() {
    if (!Recognizer)
        return T.micNoBrowser;
    if (micBlocked)
        return T.micBlocked;
    return T.micOffline;
}
/** What the child hears after a failed attempt. */
function missMessage(heard, misses, hinted) {
    if (lastError === "network")
        return T.noNetwork;
    if (micBlocked)
        return T.noMic;
    if (!heard)
        return T.tooQuiet;
    return misses >= HINT_AFTER_MISSES && !hinted ? T.takeHint : T.tryAgain;
}
// Ukrainian words lose their apostrophe before comparing (tokens), so «п’ять» is «пять» here
const NUMBERS = {
    en: ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
        "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"],
    ru: ["ноль", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять", "десять",
        "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать", "шестнадцать", "семнадцать",
        "восемнадцать", "девятнадцать", "двадцать"],
    ua: ["нуль", "один", "два", "три", "чотири", "пять", "шість", "сім", "вісім", "девять", "десять",
        "одинадцять", "дванадцять", "тринадцять", "чотирнадцять", "пятнадцять", "шістнадцять", "сімнадцять",
        "вісімнадцять", "девятнадцять", "двадцять"],
};
// Words that flip the meaning: they can never be skipped or added («I like it» ≠ «I don't like it»)
const NEGATIONS = new Set(["not", "no", "не", "нет", "ни", "ні", "нема", "немає"]);
// Dropped before comparing: articles and fillers
const SKIP = {
    en: new Set(["a", "an", "the", "um", "umm", "uh", "er", "hmm"]),
    ru: new Set(["ну", "э", "ээ", "эээ", "эм", "мм", "ммм"]),
    ua: new Set(["ну", "е", "ее", "еее", "ем", "мм", "ммм"]),
};
// Small words a long answer may miss: «я хочу игрушку» for «я хочу эту игрушку», «у меня кошка» for «у меня есть кошка»
const OPTIONAL = {
    en: new Set(["please", "my", "your", "is", "are", "am", "it", "this", "that", "to", "do", "so", "very", "now",
        "some", "of", "for", "in", "on", "at", "here", "there", "too", "really"]),
    ru: new Set(["пожалуйста", "это", "эту", "этот", "эта", "мне", "меня", "мой", "моя", "моё", "мою", "свою",
        "свой", "своё", "твой", "твою", "же", "вот", "уже", "очень", "сейчас", "так", "а", "и", "в", "на", "с", "у",
        "за", "по", "к", "тебе", "тебя", "вам", "вас"]),
    // «будь ласка» is one token (tokens); «у»/«в», «й»/«і», «із»/«зі»/«з» are already one word there.
    // Not «так» (it means «yes») and not «дуже» («Дуже дякую» must not pass for «Дякую», a phrase of its own)
    ua: new Set(["будьласка", "це", "цю", "цей", "ця", "мені", "мене", "мій", "моя", "моє", "мою", "свою", "свій",
        "своє", "твій", "твою", "же", "ж", "ось", "вже", "зараз", "а", "і", "в", "на", "з", "за", "по",
        "до", "тобі", "тебе", "вам", "вас"]),
};
/** «I'm» and «I am» must compare equal, so contractions are expanded on both sides. */
function expandEnglish(text) {
    return text
        .replace(/[’‘`]/g, "'")
        .replace(/\bcan't\b/g, "can not").replace(/\bcannot\b/g, "can not").replace(/\bwon't\b/g, "will not")
        .replace(/\blet's\b/g, "let us").replace(/\bwanna\b/g, "want to").replace(/\bgonna\b/g, "going to")
        .replace(/n't\b/g, " not").replace(/'re\b/g, " are").replace(/'m\b/g, " am").replace(/'s\b/g, " is")
        .replace(/'ve\b/g, " have").replace(/'ll\b/g, " will").replace(/'d\b/g, " would")
        .replace(/\bok\b/g, "okay").replace(/\balright\b/g, "all right")
        .replace(/'/g, "");
}
/**
 * «Привет, как дела?» → ["привет", "как", "дела"]; «ё» = «е», digits become words: «7» → «семь».
 * Ukrainian: the apostrophe goes («м’яч» → «мяч»), «будь ласка» is one word, and the sound alternations count as one
 * word: «у»/«в» (also at the start of a word: «учора» = «вчора»), «й»/«і», «із»/«зі»/«з».
 */
function tokens(text, lang) {
    let t = text.toLowerCase().replace(/ё/g, "е");
    if (lang === "en")
        t = expandEnglish(t).replace(/\b(\d+):00\b/g, "$1 oclock"); // «3:00» = «three o'clock»
    else
        t = t.replace(/(\d+):00/g, "$1");
    if (lang === "ua")
        t = t.replace(/['’ʼ`]/g, "").replace(/будь\s+ласка/g, "будьласка");
    const words = t
        .replace(/\d+/g, (d) => ` ${NUMBERS[lang][Number(d)] ?? d} `)
        .split(/[^\p{L}\p{N}]+/u)
        .filter((w) => w && !SKIP[lang].has(w));
    if (lang !== "ua")
        return words;
    const ALTERNATIONS = { у: "в", й: "і", із: "з", зі: "з" };
    const CONSONANT = /^у[бвгґджзклмнпрстфхцчшщ]/;
    return words.map((w) => ALTERNATIONS[w] ?? (CONSONANT.test(w) ? "в" + w.slice(1) : w));
}
// British spellings and words the recognizer may write instead of the American ones in the list
const SPELLING = {
    colour: "color", favourite: "favorite", favour: "favor", grey: "gray", mum: "mom", mummy: "mommy",
};
/**
 * Lenient where it's safe, strict where another word would pass. The recognizer writes real words, so a
 * different letter means a different word («light» ≠ «right», «прочтите» ≠ «простите»). English: plurals
 * count («cats» for «cat»). Russian and Ukrainian: the ending may differ («собаку» for «собака», «рада» for «рад»,
 * «поиграем» for «поиграть») — at least 3 letters and 70% of the word in common: «так» ≠ «там»,
 * «скучаю» ≠ «скучно», «пока» ≠ «покажи».
 */
function sameWord(said, want, lang) {
    if (said === want)
        return true;
    if (NEGATIONS.has(said) || NEGATIONS.has(want))
        return false; // «не» must not pass for «на»
    if (lang === "en") {
        const a = SPELLING[said] ?? said;
        const b = SPELLING[want] ?? want;
        return a === b || a === b + "s" || a === b + "es" || a + "s" === b || a + "es" === b;
    }
    const shorter = Math.min(said.length, want.length);
    const longer = Math.max(said.length, want.length);
    let prefix = 0;
    while (prefix < shorter && said[prefix] === want[prefix])
        prefix++;
    return prefix >= 3 && prefix >= longer * 0.7 && shorter - prefix <= 2 && longer - prefix <= (shorter <= 4 ? 1 : 3);
}
/**
 * Every word of the answer has to be heard, in any order. An answer of 4+ words may miss a small word
 * (OPTIONAL), one in four, but not swap it for another one: «my turn» is not «your turn». Extra words may
 * only be small ones too («а как тебя зовут?»), so a short answer can't hide inside a different phrase:
 * «how old are you» is not «how are you». An extra or missing «не» never passes.
 * strict (the tenses, where «am» and «will» are the point): no word may be missed, and the only extra words
 * allowed are the ones in this set.
 */
function matchesVariant(saidText, wantText, lang, strict) {
    const said = tokens(saidText, lang);
    const want = tokens(wantText, lang);
    if (!want.length || !said.length)
        return false;
    if (said.some((w) => NEGATIONS.has(w)) !== want.some((w) => NEGATIONS.has(w)))
        return false;
    if (said.join("") === want.join(""))
        return true; // split or joined words: «не честно», «lunch time»
    const used = said.map(() => false);
    let misses = 0;
    for (const w of want) {
        const i = said.findIndex((s, k) => !used[k] && sameWord(s, w, lang));
        if (i >= 0)
            used[i] = true;
        else if (!strict && OPTIONAL[lang].has(w))
            misses++;
        else
            return false;
    }
    // A repeated word is not extra: «привет, привет»
    const extra = said.filter((s, k) => !used[k] && !want.some((w) => sameWord(s, w, lang)));
    if (strict)
        return extra.every((s) => strict.has(s));
    if (extra.some((s) => !OPTIONAL[lang].has(s)))
        return false;
    if (misses)
        return misses <= Math.floor(want.length / 4) && extra.length === 0;
    return extra.length <= 2;
}
// ---------- Startup ----------
/**
 * Loads data.js, the saved progress and the shared listeners; adds the «🎲 Вперемешку» topic.
 * Returns false (with a message on the page) when there is nothing to play.
 */
function initGame(newRound) {
    if (typeof GAME_DATA === "undefined") {
        $("message").textContent = "Нет data.js — соберите урок: npm run build";
        return false;
    }
    // The Ukrainian build of a lesson keeps its own progress
    store = `english-phrases:${GAME_DATA.lesson}${GAME_DATA.lang === "ru" ? "" : `-${GAME_DATA.lang}`}`;
    mediaBase = sharedBase(GAME_DATA.source);
    topics = GAME_DATA.topics.filter((t) => t.items.length);
    if (!topics.length) {
        $("message").textContent = fill(T.nothingVoiced, { source: GAME_DATA.source });
        return false;
    }
    topics.push({ key: "mix", icon: "🎲", name: T.mix, items: topics.flatMap((t) => t.items) });
    score = load("score", 0);
    learned = new Set(load("learned", []));
    topicIndex = Math.max(0, topics.findIndex((t) => t.key === load("topic", "")));
    onTopicChange = newRound;
    // Voices load asynchronously in Chrome
    findNativeVoice();
    synth?.addEventListener?.("voiceschanged", findNativeVoice);
    const touch = () => {
        touched = true;
    };
    document.addEventListener("pointerdown", touch, { capture: true });
    document.addEventListener("keydown", touch, { capture: true });
    return true;
}
/** Keys of the "topic done" dialog; true if the key was taken by it. */
function overlayKey(e) {
    if ($("overlay").hidden)
        return false;
    if (e.key === "Enter")
        $("overlay-btn").click();
    return true;
}

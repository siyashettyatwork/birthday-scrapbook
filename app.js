import { fall, puff, puffFrom, startDrift } from "./confetti.js";

const DB_NAME = "birthday-scrapbook";
const DB_VERSION = 2;
const SPECK_COLORS = ["#ff4f8b", "#f5c445", "#37c2dd", "#9b7ce0", "#4fc78e"];
const TILTS = [-1.5, 1.1, -0.7, 1.6, -1.2, 0.8, -1.8, 1.3];
const TAPES = [
  { place: "tape-tl", tint: "232, 176, 194" },
  { place: "tape-top", tint: "214, 198, 156" },
  { place: "tape-tr", tint: "170, 202, 212" },
  { place: "tape-top", tint: "196, 180, 216" },
  { place: "tape-tl", tint: "180, 206, 186" },
  { place: "tape-tr", tint: "232, 194, 174" },
];

const els = {
  cover: document.getElementById("cover"),
  coverFor: document.getElementById("coverFor"),
  coverSpecks: document.getElementById("coverSpecks"),
  book: document.getElementById("book"),
  dock: document.getElementById("dock"),
  heroKicker: document.getElementById("heroKicker"),
  heroHeadline: document.getElementById("heroHeadline"),
  specks: document.getElementById("specks"),
  pageTabs: document.getElementById("pageTabs"),
  panelTitle: document.getElementById("panelTitle"),
  panelMeta: document.getElementById("panelMeta"),
  spread: document.getElementById("spread"),
  emptyState: document.getElementById("emptyState"),
  newPageModal: document.getElementById("newPageModal"),
  newPageForm: document.getElementById("newPageForm"),
  newAgeInput: document.getElementById("newAgeInput"),
  newDateInput: document.getElementById("newDateInput"),
  newHeadlineInput: document.getElementById("newHeadlineInput"),
  newPageError: document.getElementById("newPageError"),
  coverModal: document.getElementById("coverModal"),
  addModal: document.getElementById("addModal"),
  viewModal: document.getElementById("viewModal"),
  viewBody: document.getElementById("viewBody"),
  addForm: document.getElementById("addForm"),
  addTitle: document.getElementById("addTitle"),
  kindInput: document.getElementById("kindInput"),
  captionInput: document.getElementById("captionInput"),
  mediaInput: document.getElementById("mediaInput"),
  mediaLabel: document.getElementById("mediaLabel"),
  letterLabel: document.getElementById("letterLabel"),
  letterInput: document.getElementById("letterInput"),
  dropHint: document.getElementById("dropHint"),
  formError: document.getElementById("formError"),
  nameInput: document.getElementById("nameInput"),
  ageInput: document.getElementById("ageInput"),
  headlineInput: document.getElementById("headlineInput"),
  dateInput: document.getElementById("dateInput"),
  deletePageBtn: document.getElementById("deletePageBtn"),
};

let db;
let currentPageId = "";
const objectUrls = new Set();

/* ---------- storage ---------- */

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const next = request.result;
      const transaction = request.transaction;
      if (!next.objectStoreNames.contains("meta")) {
        next.createObjectStore("meta");
      }
      if (!next.objectStoreNames.contains("pieces")) {
        next.createObjectStore("pieces", { keyPath: "id" });
      }
      if (!next.objectStoreNames.contains("pages")) {
        const pagesStore = next.createObjectStore("pages", { keyPath: "id" });
        const metaStore = transaction.objectStore("meta");
        const piecesStore = transaction.objectStore("pieces");
        const oldCoverRequest = metaStore.get("cover");

        oldCoverRequest.onsuccess = () => {
          const oldCover = oldCoverRequest.result || {};
          const pageId = `birthday-${oldCover.age || "first"}`;
          pagesStore.put({
            id: pageId,
            age: oldCover.age || "27",
            date: oldCover.date || "",
            headline: oldCover.headline || "",
            note: oldCover.note || "",
            createdAt: Date.now(),
          });
          metaStore.put({ name: oldCover.name || "" }, "profile");
          metaStore.put(pageId, "currentPageId");

          piecesStore.openCursor().onsuccess = (event) => {
            const cursor = event.target.result;
            if (!cursor) return;
            cursor.update({ ...cursor.value, pageId });
            cursor.continue();
          };
        };
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function store(name, mode = "readonly") {
  return db.transaction(name, mode).objectStore(name);
}

function req(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function complete(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || new Error("Transaction aborted"));
  });
}

async function getProfile() {
  const profile = (await req(store("meta").get("profile"))) || {};
  return { name: profile.name || "" };
}

async function saveProfile(profile) {
  const transaction = db.transaction("meta", "readwrite");
  transaction.objectStore("meta").put(profile, "profile");
  await complete(transaction);
}

async function getPages() {
  const pages = await req(store("pages").getAll());
  return pages.sort((a, b) => Number(a.age) - Number(b.age) || a.createdAt - b.createdAt);
}

async function getPage(id = currentPageId) {
  return req(store("pages").get(id));
}

async function savePage(page) {
  const transaction = db.transaction("pages", "readwrite");
  transaction.objectStore("pages").put(page);
  await complete(transaction);
}

async function selectPage(id) {
  currentPageId = id;
  const transaction = db.transaction("meta", "readwrite");
  transaction.objectStore("meta").put(id, "currentPageId");
  await complete(transaction);
}

async function getPieces(pageId = currentPageId) {
  const pieces = await req(store("pieces").getAll());
  return pieces
    .filter((piece) => piece.pageId === pageId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

async function savePiece(piece) {
  const transaction = db.transaction("pieces", "readwrite");
  transaction.objectStore("pieces").put(piece);
  await complete(transaction);
}

async function deletePiece(id) {
  const transaction = db.transaction("pieces", "readwrite");
  transaction.objectStore("pieces").delete(id);
  await complete(transaction);
}

async function deletePage(pageId) {
  const pages = await getPages();
  if (pages.length < 2) {
    window.alert("Keep at least one birthday page in the book.");
    return;
  }

  const page = pages.find((item) => item.id === pageId);
  if (!page) return;

  const pieces = await getPieces(pageId);
  const label = page.age ? `the ${ordinal(page.age)} birthday page` : "this page";
  const extra = pieces.length
    ? ` This also removes ${pieces.length} ${pieces.length === 1 ? "keepsake" : "keepsakes"} on it.`
    : "";
  if (!window.confirm(`Delete ${label}?${extra}`)) return;

  const index = pages.findIndex((item) => item.id === pageId);
  const nextPage = pageId === currentPageId ? pages[index - 1] || pages[index + 1] : null;
  const nextId = nextPage ? nextPage.id : currentPageId;

  const transaction = db.transaction(["pages", "pieces", "meta"], "readwrite");
  const piecesStore = transaction.objectStore("pieces");
  for (const piece of pieces) {
    piecesStore.delete(piece.id);
  }
  transaction.objectStore("pages").delete(pageId);
  transaction.objectStore("meta").put(nextId, "currentPageId");
  await complete(transaction);

  currentPageId = nextId;
  els.coverModal.close();
  await render();
}

/* ---------- helpers ---------- */

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function revokeUrls() {
  objectUrls.forEach((url) => URL.revokeObjectURL(url));
  objectUrls.clear();
}

function urlFor(blob) {
  const url = URL.createObjectURL(blob);
  objectUrls.add(url);
  return url;
}

function longDate(value) {
  if (!value) return "";
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
  });
}

function shortDate(timestamp) {
  return new Date(timestamp)
    .toLocaleDateString(undefined, { month: "short", day: "numeric" })
    .toLowerCase();
}

const ONES = [
  "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function ageInWords(age) {
  const number = Number(age);
  if (!number || number < 1 || number > 99) return "";
  if (number < 20) return ONES[number];
  const tens = TENS[Math.floor(number / 10)];
  const ones = ONES[number % 10];
  return ones ? `${tens}-${ones}` : tens;
}

function capitalize(text) {
  return text ? text[0].toUpperCase() + text.slice(1) : text;
}

function ordinal(value) {
  const number = Number(value);
  const remainder = number % 100;
  if (remainder >= 11 && remainder <= 13) return `${number}th`;
  if (number % 10 === 1) return `${number}st`;
  if (number % 10 === 2) return `${number}nd`;
  if (number % 10 === 3) return `${number}rd`;
  return `${number}th`;
}

function defaultHeadline(age) {
  const words = ageInWords(age);
  return words ? `${capitalize(words)} looks good on you.` : "Here's to you, and to all of it.";
}

/* ---------- rendering ---------- */

function renderSpecks() {
  const specks = [
    { top: 4, left: 21, size: 7, round: true, color: 3 },
    { top: 2, left: 58, size: 9, round: false, color: 1 },
    { top: 14, left: 8, size: 6, round: false, color: 0 },
    { top: 18, left: 74, size: 7, round: true, color: 2 },
    { top: 33, left: 44, size: 10, round: false, color: 4 },
    { top: 46, left: 14, size: 7, round: true, color: 0 },
    { top: 52, left: 66, size: 6, round: false, color: 1 },
    { top: 62, left: 33, size: 7, round: true, color: 1 },
    { top: 70, left: 88, size: 6, round: true, color: 3 },
    { top: 78, left: 5, size: 8, round: false, color: 2 },
    { top: 88, left: 52, size: 6, round: true, color: 4 },
    { top: 26, left: 95, size: 7, round: false, color: 0 },
  ];

  els.specks.innerHTML = specks
    .map((speck) => {
      const color = SPECK_COLORS[speck.color];
      const shape = speck.round
        ? `width:${speck.size}px;height:${speck.size}px`
        : `width:${speck.size * 0.62}px;height:${speck.size}px;border-radius:2px;transform:rotate(${speck.left % 60}deg)`;
      return `<span class="speck" style="top:${speck.top}%;left:${speck.left}%;background:${color};${shape}"></span>`;
    })
    .join("");
  els.coverSpecks.innerHTML = els.specks.innerHTML;
}

function thumbMarkup(piece) {
  if (piece.kind === "letter") {
    return `
      <div class="thumb thumb-letter">
        <p>${escapeHtml(piece.letter || "")}</p>
      </div>
    `;
  }

  const url = urlFor(piece.media);
  if (piece.kind === "video") {
    return `
      <div class="thumb">
        <video src="${url}" muted preload="metadata"></video>
        <span class="play"><span></span></span>
      </div>
    `;
  }

  return `
    <div class="thumb">
      <img src="${url}" alt="${escapeHtml(piece.caption || "a memory")}" loading="lazy" />
    </div>
  `;
}

function keepsakeMarkup(piece, index) {
  const fallbackTitle =
    piece.kind === "letter" ? "Untitled letter" : piece.kind === "video" ? "Untitled clip" : "Untitled photo";
  const tilt = TILTS[index % TILTS.length];
  const tape = TAPES[index % TAPES.length];
  return `
    <article
      class="keepsake"
      data-id="${piece.id}"
      style="--tilt:${tilt}deg; animation-delay:${index * 55}ms"
    >
      <span class="tape ${tape.place}" style="--tape:${tape.tint}"></span>
      <button class="remove" type="button" data-delete="${piece.id}" aria-label="Remove">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg>
      </button>
      ${thumbMarkup(piece)}
      <h3>${escapeHtml(piece.caption || fallbackTitle)}</h3>
      <p class="meta">${piece.kind} &middot; ${shortDate(piece.createdAt)}</p>
    </article>
  `;
}

async function render() {
  revokeUrls();
  const [profile, pages, page, pieces] = await Promise.all([
    getProfile(),
    getPages(),
    getPage(),
    getPieces(),
  ]);

  if (!page) return;

  const kickerParts = [
    longDate(page.date),
    profile.name ? `for ${profile.name}` : "",
    page.age ? `turning ${page.age}` : "",
  ].filter(Boolean);
  els.heroKicker.textContent = kickerParts.length
    ? kickerParts.join(" \u00b7 ")
    : "a scrapbook in progress";
  els.heroHeadline.textContent = page.headline || defaultHeadline(page.age);
  els.coverFor.textContent = profile.name ? `for ${profile.name}` : "";
  els.panelTitle.textContent = page.age
    ? `The ${ordinal(page.age)} birthday page`
    : "The celebration page";

  const photos = pieces.filter((piece) => piece.kind === "photo").length;
  const videos = pieces.filter((piece) => piece.kind === "video").length;
  const letters = pieces.filter((piece) => piece.kind === "letter").length;
  const pad = (value) => String(value).padStart(2, "0");
  els.panelMeta.textContent = `${pad(photos)} photos \u00b7 ${pad(videos)} videos \u00b7 ${pad(letters)} letters`;

  els.emptyState.classList.toggle("hidden", pieces.length > 0);
  els.spread.innerHTML = pieces.map(keepsakeMarkup).join("");
  els.pageTabs.innerHTML = pages
    .map(
      (birthdayPage) => `
        <div class="page-tab-wrap">
          <button
            class="page-tab ${birthdayPage.id === currentPageId ? "active" : ""}"
            type="button"
            data-page-id="${birthdayPage.id}"
            ${birthdayPage.id === currentPageId ? 'aria-current="page"' : ""}
          >
            <strong>${escapeHtml(birthdayPage.age || "—")}</strong>
            <span>${birthdayPage.date ? new Date(`${birthdayPage.date}T00:00:00`).getFullYear() : "birthday"}</span>
          </button>
          ${
            pages.length > 1
              ? `<button class="tab-delete" type="button" data-delete-page="${birthdayPage.id}" aria-label="Delete the ${escapeHtml(String(birthdayPage.age || ""))} page">×</button>`
              : ""
          }
        </div>
      `,
    )
    .join("");
}

async function fillCoverForm() {
  const [profile, page, pages] = await Promise.all([getProfile(), getPage(), getPages()]);
  els.nameInput.value = profile.name;
  els.ageInput.value = page.age;
  els.headlineInput.value = page.headline;
  els.dateInput.value = page.date;
  els.headlineInput.placeholder = defaultHeadline(page.age);
  els.deletePageBtn.classList.toggle("hidden", pages.length < 2);
}

/* ---------- interactions ---------- */

function openAdd(kind) {
  els.addForm.reset();
  els.formError.classList.add("hidden");
  els.kindInput.value = kind;
  els.dropHint.textContent = "Drop a file here, or click to choose";
  const isLetter = kind === "letter";
  els.letterLabel.classList.toggle("hidden", !isLetter);
  els.mediaLabel.classList.toggle("hidden", isLetter);
  els.mediaInput.accept = kind === "video" ? "video/*" : "image/*";
  els.addTitle.textContent =
    kind === "letter" ? "Write a letter" : kind === "video" ? "Add a video" : "Add a photo";
  els.addModal.showModal();
}

async function openPiece(id) {
  const piece = await req(store("pieces").get(id));
  if (!piece) return;

  if (piece.kind === "letter") {
    els.viewBody.innerHTML = `
      <article class="letter-open">
        <h3>${escapeHtml(piece.caption || "A letter")}</h3>
        <p>${escapeHtml(piece.letter || "")}</p>
      </article>
    `;
  } else {
    const url = urlFor(piece.media);
    const media =
      piece.kind === "video"
        ? `<video class="view-media" src="${url}" controls autoplay></video>`
        : `<img class="view-media" src="${url}" alt="${escapeHtml(piece.caption || "")}" />`;
    els.viewBody.innerHTML = `
      ${media}
      <p class="view-caption">${escapeHtml(piece.caption || "")}</p>
    `;
  }

  els.viewModal.showModal();
}

document.getElementById("addPhoto").addEventListener("click", () => openAdd("photo"));
document.getElementById("addVideo").addEventListener("click", () => openAdd("video"));
document.getElementById("addLetter").addEventListener("click", () => openAdd("letter"));
document.getElementById("editCoverBtn").addEventListener("click", async () => {
  await fillCoverForm();
  els.coverModal.showModal();
});
document.getElementById("newPageBtn").addEventListener("click", async () => {
  const pages = await getPages();
  const highestAge = Math.max(0, ...pages.map((page) => Number(page.age) || 0));
  els.newPageForm.reset();
  els.newPageError.classList.add("hidden");
  els.newAgeInput.value = highestAge ? highestAge + 1 : "";
  els.newHeadlineInput.placeholder = defaultHeadline(highestAge + 1);
  els.newPageModal.showModal();
});
document.getElementById("cancelNewPage").addEventListener("click", () => els.newPageModal.close());
document.getElementById("cancelAdd").addEventListener("click", () => els.addModal.close());
document.getElementById("closeView").addEventListener("click", () => els.viewModal.close());
els.deletePageBtn.addEventListener("click", async () => {
  await deletePage(currentPageId);
});

els.heroHeadline.addEventListener("click", () => puffFrom(els.heroHeadline, 26));

function showCover() {
  els.cover.classList.remove("hidden");
  els.book.classList.add("hidden");
  els.dock.classList.add("hidden");
  document.body.classList.remove("reading");
}

function openBook() {
  els.cover.classList.add("hidden");
  els.book.classList.remove("hidden");
  els.dock.classList.remove("hidden");
  document.body.classList.add("reading");
  puff(window.innerWidth / 2, window.innerHeight * 0.42, 36);
  fall(16);
}

document.getElementById("openBook").addEventListener("click", openBook);
document.getElementById("backToCover").addEventListener("click", showCover);

document.getElementById("coverForm").addEventListener("submit", async (event) => {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();
  const page = await getPage();
  await saveProfile({ name: els.nameInput.value.trim() });
  await savePage({
    ...page,
    age: els.ageInput.value.trim(),
    headline: els.headlineInput.value.trim(),
    date: els.dateInput.value,
  });
  await render();
  els.coverModal.close();
});

els.newPageForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const age = els.newAgeInput.value.trim();
  const pages = await getPages();
  els.newPageError.classList.add("hidden");

  if (pages.some((page) => String(page.age) === age)) {
    els.newPageError.textContent = `A page for age ${age} already exists.`;
    els.newPageError.classList.remove("hidden");
    return;
  }

  const page = {
    id: crypto.randomUUID(),
    age,
    date: els.newDateInput.value,
    headline: els.newHeadlineInput.value.trim(),
    createdAt: Date.now(),
  };
  await savePage(page);
  await selectPage(page.id);
  els.newPageModal.close();
  await render();
  puffFrom(els.heroHeadline, 42);
});

els.pageTabs.addEventListener("click", async (event) => {
  const remove = event.target.closest("[data-delete-page]");
  if (remove) {
    event.stopPropagation();
    await deletePage(remove.dataset.deletePage);
    return;
  }
  const tab = event.target.closest("[data-page-id]");
  if (!tab || tab.dataset.pageId === currentPageId) return;
  await selectPage(tab.dataset.pageId);
  await render();
  window.scrollTo({ top: 0, behavior: "smooth" });
  fall(12);
});

els.mediaInput.addEventListener("change", () => {
  const file = els.mediaInput.files[0];
  els.dropHint.textContent = file ? file.name : "Drop a file here, or click to choose";
});

["dragenter", "dragover"].forEach((type) => {
  els.mediaLabel.addEventListener(type, (event) => {
    event.preventDefault();
    els.mediaLabel.classList.add("dragging");
  });
});

["dragleave", "drop"].forEach((type) => {
  els.mediaLabel.addEventListener(type, () => els.mediaLabel.classList.remove("dragging"));
});

els.mediaLabel.addEventListener("drop", (event) => {
  event.preventDefault();
  const file = event.dataTransfer?.files?.[0];
  if (!file) return;
  els.mediaInput.files = event.dataTransfer.files;
  els.dropHint.textContent = file.name;
});

els.addForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  event.stopPropagation();
  if (event.submitter?.value === "cancel") return;
  const kind = els.kindInput.value;
  const caption = els.captionInput.value.trim();
  els.formError.classList.add("hidden");

  try {
    if (kind === "letter") {
      const letter = els.letterInput.value.trim();
      if (!letter) throw new Error("Write a few words before adding the letter.");
      await savePiece({
        id: crypto.randomUUID(),
        pageId: currentPageId,
        kind,
        caption,
        letter,
        createdAt: Date.now(),
      });
    } else {
      const file = els.mediaInput.files[0];
      if (!file) throw new Error("Choose a file to add.");
      await savePiece({
        id: crypto.randomUUID(),
        pageId: currentPageId,
        kind,
        caption,
        media: file,
        createdAt: Date.now(),
      });
    }
    els.addModal.close();
    await render();
    puff(window.innerWidth / 2, window.innerHeight * 0.62, 40);
  } catch (error) {
    els.formError.textContent = error.message;
    els.formError.classList.remove("hidden");
  }
});

els.spread.addEventListener("click", async (event) => {
  const remove = event.target.closest("[data-delete]");
  if (remove) {
    event.stopPropagation();
    if (confirm("Remove this from the page?")) {
      await deletePiece(remove.dataset.delete);
      await render();
    }
    return;
  }
  const keepsake = event.target.closest("[data-id]");
  if (keepsake) openPiece(keepsake.dataset.id);
});

async function start() {
  renderSpecks();
  db = await openDb();
  let pages = await getPages();
  if (!pages.length) {
    const firstPage = {
      id: crypto.randomUUID(),
      age: "27",
      date: "",
      headline: "",
      note: "",
      createdAt: Date.now(),
    };
    await savePage(firstPage);
    pages = [firstPage];
  }
  const savedPageId = await req(store("meta").get("currentPageId"));
  currentPageId = pages.some((page) => page.id === savedPageId) ? savedPageId : pages.at(-1).id;
  await selectPage(currentPageId);
  await render();
  fall(18);
  startDrift();
}

start();

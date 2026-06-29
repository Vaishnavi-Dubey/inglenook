# Inglenook & Marginalia: AI Reading Suite

A beautiful, local-first personal reading companion and dashboard suite. It features a cozy illustrated reading room tracker, an AI-powered margins annotator, and an all-in-one Reading Vault dashboard.

The entire suite runs fully in the browser with **local-first storage (LocalStorage)**, meaning your data, library, quotes, and API keys never leave your machine.

---

## 🌟 Key Components

### 1. Inglenook (`inglenook.html`)
*Your cozy personal reading room.*
* **Cozy Interactive Library:** A visually rich, illustrated reading room showing your bookshelves, progress, and TBR (To Be Read) list.
* **Open Library Integration:** Search millions of books by title, author, or ISBN and instantly add them to your shelves.
* **Auto-Discovery / Explore:** Explore curated bookshelves and search recommendations.
* **Advanced Statistics:** Visual charts and metrics analyzing your reading habits, genre breakdown, page count, and goals.
* **Fully Responsive & Dark Mode:** Auto-adjusts or toggles between parchment-light and rich espresso-dark mode.

#### Screenshots
| Reading Room (Light Mode) | Reading Room (Dark Mode) |
| :---: | :---: |
| ![Inglenook Room](assets/inglenook_room.png) | ![Inglenook Room Dark](assets/inglenook_dark.png) |

---

### 2. Marginalia (`index.html`)
*Your AI-powered reading companion.*
* **PDF & Text Annotation:** Upload PDF books or paste plaintext chapters.
* **AI Marginal Notes:** Integrates with Gemini, OpenAI, or OpenRouter to automatically add contextual annotations, definitions, historical references, and literary critique in the page margins as you read.
* **Interactive Highlights:** Highlight sentences, add manual notes, and choose color highlights (ink, gold, green, burgundy).
* **Export and Share:** Copy your annotated text, export to Markdown, or save notes locally.

#### Screenshots
| Marginalia AI Annotator |
| :---: |
| ![Marginalia Results](assets/marginalia_results.png) |

---

### 3. The Reading Vault (`reading-vault.html`)
*The ultimate unified reading dashboard.*
* **Unified Workspace:** Combines the cataloging of **Inglenook** with the AI annotation powers of **Marginalia**.
* **Quote Keeper:** Keep track of your favorite quotes with page numbers and authors.
* **Reading Goals Tracker:** Visual goals showing your current progress against daily or yearly targets.
* **Local Backups:** Export your entire vault data as a clean JSON file and import it anytime.

#### Screenshots
| Reading Vault Dashboard | AI Annotation Workspace |
| :---: | :---: |
| ![Reading Vault Home](assets/reading_vault_home.png) | ![Reading Vault Annotator](assets/reading_vault_annotator.png) |

---

## 🛠️ Tech Stack

* **Core Structure & Layout:** Semantic HTML5, CSS Grid & Flexbox.
* **Design & Styling:** Vanilla CSS3 with custom variables, smooth transitions, custom scrollbars, and an SVG noise-filter paper texture overlay for a tactile, book-like feel.
* **Logic & State:** Vanilla ES6+ JavaScript, local-first client-side state machine using HTML5 `localStorage`.
* **Integrations:**
  * [PDF.js](https://mozilla.github.io/pdf.js/) for client-side PDF rendering and text parsing.
  * [Open Library API](https://openlibrary.org/developers/api) for rich book metadata lookup.
  * LLM API integrations (Gemini, OpenRouter, OpenAI) for real-time contextual annotations.
* **E2E Testing:** [Playwright](https://playwright.dev/) for robust, multi-browser integration and visual regression tests.

---

## 🚀 Getting Started

No installation or backend server is required! You can open any page directly in your browser.

### Option A: Open directly
Simply double-click or open any of the following files in your favorite browser:
* `inglenook.html`
* `reading-vault.html`
* `index.html`

### Option B: Local Dev Server
If you prefer running a local server (recommended for PDF.js modules and local development):
```bash
# Install development dependencies (Playwright)
npm install

# Start a local web server (e.g. using python or npx serve)
npx serve .
```

---

## 🧪 Testing

The project is fully tested with Playwright. To run the automated end-to-end integration and visual tests:

```bash
# Install Playwright browsers (first-time setup)
npx playwright install

# Run all test suites
npx playwright test

# Open test reports
npx playwright show-report
```

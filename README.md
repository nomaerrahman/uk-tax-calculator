# UK Take-Home Pay Calculator

A responsive UK income tax calculator built using **React + Vite**.

This application calculates:

- Income Tax (rUK – England, Wales, Northern Ireland)
- National Insurance (Category A)
- Take-home pay (annual, monthly, weekly)
- Pension contribution adjustments
- UK tax code handling (1257L, BR, D0, D1, NT, K codes)
- Downloadable PDF tax breakdown report
- Light / Dark mode
- Fully responsive layout (desktop, tablet, mobile)

---

## 🚀 Features

- Income slider with Yearly / Monthly / Weekly options
- Manual income input for precision
- Tax code interpretation and allowance display
- Pension contribution adjustment
- Clean PDF export with formatted breakdown
- Accessible UI with consistent design system
- Mobile-friendly responsive layout
- Dark / Light theme toggle

---

## 🛠 Tech Stack

- React
- Vite
- JavaScript (ES6+)
- jsPDF (PDF generation)
- Custom CSS design system

---

## 📦 Installation

Clone the repository:

```bash
git clone https://github.com/nomaerrahman/uk-tax-calculator.git
cd uk-tax-calculator
```

Install dependencies:

```bash
npm install
```

---

## ▶️ Running the Application (Development Mode)

Start the development server:

```bash
npm run dev
```

You should see output similar to:

```
VITE ready
Local: http://localhost:5173/
```

Open your browser and visit:

```
http://localhost:5173/
```

The app will automatically reload when you edit files.

---

## 🏗 Production Build

To create an optimized production build:

```bash
npm run build
```

This will generate a `dist/` folder.

To preview the production build locally:

```bash
npm run preview
```

---

## 📁 Project Structure

```
uk-tax-calculator/
│
├── src/
│   ├── App.jsx
│   ├── app.css
│   ├── lib/
│   │   └── ukTax.js
│   └── main.jsx
│
├── index.html
├── package.json
└── README.md
```

---

## 📊 Tax Coverage

- rUK income tax bands
- Employee NI (Category A)
- Personal Allowance interpretation
- BR, D0, D1, NT, 0T, and K tax codes
- Pension deduction simulation

**Note:** This is a simplified calculator intended for demonstration and portfolio purposes. It does not account for student loans, Scottish tax bands, benefits, or full HMRC edge cases.

---

## 📱 Responsive Design

- Two-column layout on desktop
- Single-column layout on tablet and mobile
- Optimized spacing for touch interaction
- Accessible color contrast

---

## 👤 Author

© 2026 nomaerrahman

---

## 🔒 License

This project is for educational and portfolio use.

---

## 🌐 Deploy to GitHub Pages (no blank page)

This repo is configured to deploy automatically to **GitHub Pages** using a GitHub Actions workflow:

- Workflow file: `.github/workflows/deploy.yml`
- Output folder published: `dist/`

### 1) Set the correct Vite base path

Open `vite.config.js` and make sure `base` matches your **repository name**:

```js
export default defineConfig({
  plugins: [react()],
  base: "/YOUR-REPO-NAME/",
});
```

✅ Example: if your repo is `uk-tax-calculator`, the base must be:

```js
base: "/uk-tax-calculator/",
```

If you are deploying to a **username GitHub Pages site** (repo name like `username.github.io`), then set:

```js
base: "/",
```

### 2) Enable Pages to deploy from GitHub Actions

In your GitHub repo:

- **Settings → Pages**
- **Build and deployment → Source: GitHub Actions**

### 3) Push to `main`

Every push to `main` triggers the workflow, builds the app, and deploys `dist/`.

If you still see a blank page, open the browser devtools **Console** and **Network** tab — usually it’s a wrong `base` path (JS bundle 404).

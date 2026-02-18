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

## 🌐 Deploy to GitHub Pages (no blank screen)

This repo includes a GitHub Actions workflow that builds the app and publishes the **dist/** folder to **GitHub Pages**.

1. Push to the `main` branch.
2. In GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Your site will be available at the Pages URL shown in the workflow run.

Why this avoids a blank page:
- Asset paths are configured with a **relative base** in `vite.config.js`.
- CSS import casing is fixed (Linux is case-sensitive).

---

## 📁 Project Structure

```
uk-tax-calculator/
│
├── src/
│   ├── App.jsx
│   ├── App.css
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

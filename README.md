# 🎓 KMITL Pundit Status Checker

**🌐 Live Demo:** [https://pooh303.github.io/kmitl-pundit-status/](https://pooh303.github.io/kmitl-pundit-status/)

A completely **serverless, static website** that tracks and displays the graduation registration status for students at King Mongkut's Institute of Technology Ladkrabang (KMITL). 

By leveraging **GitHub Actions**, this project automatically scrapes data from the official university portal at scheduled intervals, eliminating the need for a dedicated backend server or database! 🚀

---

## ✨ Features

- **🤖 Automated Data Scraping**: A Python script runs via GitHub Actions every 20 minutes to fetch the latest registration statuses.
- **⚡ Zero Server Costs**: Uses GitHub Pages for hosting and GitHub Actions as a cron-based backend. Completely free to run!
- **🔍 Instant Search & Filter**: Real-time filtering by student ID or name, combined with interactive "status capsules" to quickly sort by registration progress.
- **📱 Responsive UI**: A clean, modern, and mobile-friendly interface.
- **🔒 Secure Architecture**: No CORS issues and no risk of exposing backend credentials, as the scraping happens independently on the CI/CD pipeline.

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3 (Vanilla), JavaScript
- **Backend / Scraping:** Python 3 (`urllib`, `BeautifulSoup4`)
- **CI/CD Automation:** GitHub Actions
- **Hosting:** GitHub Pages

---

## ⚙️ How It Works

1. **Scheduled Trigger:** GitHub Actions triggers `.github/workflows/scrape.yml` every 20 minutes.
2. **Data Extraction:** The `scraper.py` script sends requests to the KMITL registration portal, iterating through the defined student ID range.
3. **Data Storage:** The scraped data is formatted and saved directly into `data.json`.
4. **Auto-Commit:** The GitHub Action bot commits the updated `data.json` back into the repository.
5. **Client-Side Rendering:** The static frontend (`index.html`) fetches `data.json` and renders the UI dynamically for users.

---

## 🚀 Setup & Installation

If you want to deploy your own instance of this project:

1. **Fork or Clone** this repository.
2. Go to the **Actions** tab in your repository and enable GitHub Actions.
3. Edit `scraper.py` (Line 71) to change the student ID range you wish to track:
   ```python
   # Example: Scrape IDs from 65070001 to 65070300
   results = scrape_students(1, 300, "65070")
   ```
4. Go to repository **Settings > Pages** and set the source to `main` branch.
5. Wait for the first GitHub Action run to generate `data.json`.
6. Your site is now live! 🎉

---
*Disclaimer: This is an unofficial tool created for convenience. It is not affiliated with or endorsed by KMITL. Please be mindful of the university's web traffic when setting up your own scraping intervals.*

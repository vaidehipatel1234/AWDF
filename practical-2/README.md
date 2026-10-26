# Practical 2: State Management and Routing in React

**Student Details:**
- **Name:** Vaidehi Patel
- **Student ID:** 24CS079
- **Email:** 24cs079@charusat.edu.in
- **Course:** ITUE301: Advance Web Development Framework
- **Institute:** CSPIT, Charotar University of Science and Technology (CHARUSAT)

---

## 📌 Overview
This project extends the student portfolio application from Practical 1 by introducing client-side multi-page routing via **React Router v6** and reactive state management using the **`useState`** hook.

## 🚀 Implemented Features & Routes

### 1. Navigation & Routing (React Router v6)
- **`<BrowserRouter>`**: Wraps the application in `src/main.jsx`.
- **`<NavBar />`**: Navigation bar with client-side `<NavLink>` links (no page reloads):
  - `/` → **Home (`<Home />`)**: Personal introduction, department, and technical skills.
  - `/projects` → **Projects (`<Projects />`)**: Showcase of student projects with dynamic state filtering.
  - `/contact` → **Contact (`<Contact />`)**: Real-time controlled form and interactive feedback.
  - `*` → **404 Not Found (`<NotFound />`)**: Fallback error route with easy navigation back to Home.

### 2. Reactive State Management (`useState`)
- **Controlled Contact Input**: Captures user input and synchronizes state in real time via `onChange`.
- **Live Character Counter**: Computes and displays the length of the message in real time.
- **UI Visibility Toggle**: Toggles help tips and FAQs on the contact page.
- **Dark/Light Mode Theme Toggle**: Managed at the application root level with CSS theme classes (`.dark-theme` / `.light-theme`).
- **Category Filter State**: Filter projects on the Projects page by category (`All`, `React`, `Frontend`, `FullStack`).

## 🛠️ Setup & Running Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Build production bundle:**
   ```bash
   npm run build
   ```

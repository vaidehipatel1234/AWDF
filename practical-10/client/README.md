# Practical 3: API Integration and Data Rendering in React

**Student Details:**
- **Name:** Vaidehi Patel
- **Student ID:** 24CS079
- **Email:** 24cs079@charusat.edu.in
- **Course:** ITUE301: Advance Web Development Framework
- **Institute:** CSPIT, Charotar University of Science and Technology (CHARUSAT)

---

## 📌 Practical 3 Overview & Objective
To consume a public REST API (**GitHub REST API**) in React and handle asynchronous lifecycle states (**loading**, **error**, and **success**) using React's **`useEffect`** and **`useState`** hooks.

The **Projects** page (`src/components/Projects.jsx`) built in Practical 2 serves as the integration point, transforming static project data into dynamic, real-time repository cards fetched directly from GitHub.

---

## 🏗️ Architecture & Component Flow
```
Projects.jsx
 ├── useEffect() → triggers asynchronous fetch on component mount
 ├── useState: repos (data), loading, error, searchQuery, simulateError
 ├── [loading] → <Spinner />
 ├── [error]   → <ErrorMessage message={error} onRetry={handleRetry} />
 └── [success] → <RepoList data={filteredRepos} />
```

---

## 🚀 Implemented Features

### 1. Asynchronous REST API Integration (`useEffect`)
- **API Endpoint:** `https://api.github.com/users/vaidehipatel1234/repos?sort=updated`
- Initiates the `fetch` request immediately upon component mount via `useEffect` with an empty dependency array `[]` (plus trigger variables for retry and testing), preventing infinite re-fetching cycles.
- Correctly parses responses and validates `res.ok` to catch HTTP errors (such as 404 Not Found or 403 Rate Limit Exceeded).

### 2. Tri-State Lifecycle Management (`useState`)
- **`repos` (Array):** Stores the parsed array of repository objects.
- **`loading` (Boolean):** Set to `true` while the network request is in flight and safely cleared in `.finally(() => setLoading(false))`.
- **`error` (String | null):** Captures error descriptions or network failures to render graceful diagnostic feedback.

### 3. Loading Spinner Component (`<Spinner />`)
- Displays an animated circular spinner with informative textual feedback while the asynchronous request is pending.

### 4. Error Message Component (`<ErrorMessage />`)
- Renders an alert box with diagnostic hints when an API request fails, preventing crashes and blank screens.

### 5. Supplementary Problem: Interactive Retry Button
- Includes a **Retry API Request** button in `<ErrorMessage />` and a **Refresh** button in the header that resets error/loading states and re-executes the API fetch without requiring a full page refresh.

### 6. Supplementary Problem: Real-Time Search & Filtering
- Includes a search input above the repository list that dynamically filters repositories by name in real time (`filteredRepos`).
- Displays a dynamic count of filtered vs. total repositories (e.g., *Showing 14 of 30 repositories*).

### 7. Supplementary Problem: Repository Star Count & Metadata Rendering
- Displays the star count (⭐ `stargazers_count`) and fork count (🍴 `forks_count`) alongside the repository title.
- Shows primary language badges, repository description, public/private status, and direct GitHub links.

### 8. Lab Verification: Error Path Simulation Toggle
- An interactive **Simulate Error Path** button in the UI temporarily alters the endpoint to test and verify the error state and retry functionality on demand.

---

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

4. **Lint and code check:**
   ```bash
   npm run lint
   ```

---

## 📄 Lab Documentation Deliverable
- Updated report generated as **`pract-3-awdf-24cs079.docx`** with the updated Aim, source code, repository links, detailed output explanations, and 4 high-resolution screenshots.

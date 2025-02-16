# Karate Tournament Scoring (Version 2)

This React web app manages competitor ranks and scores for a karate tournament. Each competitor can receive “ticks” (indicating rank placement). When finalizing a competitor, you can “Update” them to confirm their place, or “Assign Scores” to convert their ticks to a numeric score.

## Features

- **Add Competitor (blue button)**: Dynamically adds new competitors.
- **Update (green button)**: Finalizes any newly assigned places (blue) to become green and clears previous scores.
- **Assign Scores (green button)**: Takes all ranked competitors (blue/green) and assigns a numeric score (9.99 to 9.93).
- **Reset (red button)**: Resets to default 5 competitors.
- **Rank Controls** (for non-green competitors):
  - **+** / **–**: Increment or decrement the competitor's rank (ticks).
  - **1st / 2nd / 3rd / 4th**: Jump directly to a specific rank.
  - **Max**: Jumps one above the current highest rank.
- **Del (red button)**: Removes a competitor.
- **Edit button** (only appears if competitor is green): Reverts them back to blue for adjustments.

## Getting Started

1. **Clone** or **download** this repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/karate-scoring-app.git
   ```
2. **Install dependencies**:
   ```bash
   cd karate-scoring-app
   npm install
   ```
3. **Run locally**:
   ```bash
   npm start
   ```
   The app should open at [http://localhost:3000](http://localhost:3000).

## Deploying to GitHub Pages

1. **Add the `homepage` field** in your `package.json`, pointing to your GitHub Pages URL:
   ```json
   {
     "name": "karate-scoring-app",
     "version": "1.0.0",
     "private": true,
     "homepage": "https://YOUR_USERNAME.github.io/karate-scoring-app",
     ...
   }
   ```
2. **Install `gh-pages`**:
   ```bash
   npm install --save-dev gh-pages
   ```
3. **Add scripts** to your `package.json`:
   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d build",
       "start": "react-scripts start",
       "build": "react-scripts build",
       ...
     }
   }
   ```
4. **Commit and push** your changes to GitHub if you haven’t already.
5. **Deploy** by running:
   ```bash
   npm run deploy
   ```
6. Your app will be hosted at:
   ```
   https://YOUR_USERNAME.github.io/karate-scoring-app
   ```

## Usage

1. **Add or remove** competitors using **Add Competitor** or **Del**.
2. **Change ranks** using the **+** / **–** or **1st / 2nd / 3rd / 4th / Max** buttons.
3. **Update** finalizes all newly placed competitors (turns them green).
4. **Assign Scores** calculates numeric scores (9.99 to 9.93) for all ranks.
5. **Reset** to restore the default list of competitors.

## Contributing

1. **Fork** the repo.
2. **Create a new branch** (`git checkout -b feature/newFeature`).
3. **Commit** your changes (`git commit -m 'Add a new feature'`).
4. **Push** to the branch (`git push origin feature/newFeature`).
5. **Open a Pull Request**.

## License

You may use or modify this code freely for personal or commercial projects. If you build upon or fork it, a link back to the source is appreciated but not required.

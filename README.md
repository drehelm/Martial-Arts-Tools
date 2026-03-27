# Martial Arts Tools

A collection of web applications for karate tournament management, built as a single React app deployed to GitHub Pages.

**Live site:** https://drehelm.github.io/Martial-Arts-Tools/

## Tools

### Tournament Bracket Generator
Generate a print-friendly single-elimination bracket for 2–32 competitors. BYEs are distributed to guarantee the Final always has two real competitors. Includes a MARA winners panel and referee signature fields. Mobile-friendly with a summary card showing competitor count, bye count, and round count.

[Open Tool](https://drehelm.github.io/Martial-Arts-Tools/#/bracket)

### Referee Scoresheet
Track competitors and live scores across a division. Three judges each record a score per competitor using +/− controls. Scores update live with automatic ranking. Supports URL pre-filling of competitor names (`?c=Alice,Bob,Carol`).

[Open Tool](https://drehelm.github.io/Martial-Arts-Tools/#/scoresheet)

### Division Calculator
Aggregate three judge scores per competitor, detect scoring discrepancies in real time, and display live placements with tie-breaking. Supports Black Belt (9.93–9.99) and Coloured Belt (8.93–8.99) modes. Outlier detection flags when a judge's score differs significantly from the other two and suggests a correction. Supports URL pre-filling of competitor names (`?c=Alice,Bob,Carol`).

[Open Tool](https://drehelm.github.io/Martial-Arts-Tools/#/calculator)

## Development

**Stack:** Vite + React 18 + TypeScript + Tailwind CSS v3 + Shadcn UI + React Router (HashRouter)

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## License

MIT

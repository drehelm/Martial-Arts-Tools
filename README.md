# Martial-Arts-Tools

A collection of web applications designed to simplify and streamline karate tournament management. This suite of tools helps tournament organizers, referees, and judges manage competitions efficiently.

![GitHub](https://img.shields.io/github/license/drehelm/Martial-Arts-Tools)

## Overview

This repository contains three complementary web applications that work together to provide a complete solution for karate tournament management:

1. **Karate Ref Scoresheet** - Tool for referees to track competitor placements and assign scores during kata divisions.
2. **Karate Division Calculator** - Aggregates judge scores, detects scoring discrepancies, and calculates final placements.
3. **Karate Tournament Bracket Generator** - Creates single elimination tournament brackets with support for byes and visualization of the match tree.

## Components

### Karate Ref Scoresheet

A tool for karate referees to track competitors, assign rankings, and calculate scores based on those rankings during tournament divisions.

**Key Features:**
- Competitor management with status tracking
- Ranking mechanism with visual tick marks
- Automatic score assignment based on rank
- Status management (empty, blue, green) for tracking judging progress
- Confirmation system for destructive actions

### Karate Division Calculator

A tool to calculate and aggregate scores for karate tournament competitors, handle score discrepancies, and determine final placements.

**Key Features:**
- Scoring system with 3 scores per competitor (9.93-9.99 range)
- Point conversion system (lower points = better placement)
- Score discrepancy detection for outliers
- Tie-breaking logic using highest individual scores
- Automatic placement calculation

### Karate Tournament Bracket Generator

A tool to create and visualize single elimination tournament brackets, automatically handling byes when the number of competitors is not a power of 2.

**Key Features:**
- Simplified bracket generation based on competitor count
- Automatic bye distribution
- Visual bracket representation with clean, professional design
- Paper-friendly printing with export options
- Support for manual tournament progression tracking

## Technology Stack

All applications are built with:
- React.js
- Tailwind CSS
- Shadcn UI components
- Mobile-friendly responsive design

## Installation

Clone the repository and install dependencies for each application:

```bash
# Clone the repository
git clone https://github.com/drehelm/Martial-Arts-Tools.git
cd Martial-Arts-Tools

# Install dependencies for Karate Division Calculator
cd karate-division-calculator
npm install

# Install dependencies for Karate Ref Scoresheet
cd ../karate-ref-scoresheet
npm install

# Install dependencies for Karate Tournament Bracket Generator
cd ../karate-tournament-bracket
npm install
```

## Usage

Each application can be run independently:

### Karate Division Calculator

```bash
cd karate-division-calculator
npm start
```

### Karate Ref Scoresheet

```bash
cd karate-ref-scoresheet
npm start
```

### Karate Tournament Bracket Generator

```bash
cd karate-tournament-bracket
npm start
```

## Deployment

Each application can be deployed to GitHub Pages:

```bash
# Deploy Karate Division Calculator
cd karate-division-calculator
npm run deploy

# Deploy Karate Ref Scoresheet
cd ../karate-ref-scoresheet
npm run deploy

# Deploy Karate Tournament Bracket Generator
cd ../karate-tournament-bracket
npm run deploy
```

## Live Demos

Visit the applications online:

- [Karate Division Calculator](https://drehelm.github.io/Martial-Arts-Tools/karate-division-calculator/)
- [Karate Ref Scoresheet](https://drehelm.github.io/Martial-Arts-Tools/karate-ref-scoresheet/)
- [Karate Tournament Bracket Generator](https://drehelm.github.io/Martial-Arts-Tools/karate-tournament-bracket/)

## Workflow Integration

While these applications are separate, they represent complementary functions in a karate tournament management workflow:

1. **Karate Ref Scoresheet** is used during the ranking/judging phase to determine competitor placements.
2. **Karate Division Calculator** aggregates individual judge scores and calculates final placements.
3. **Karate Tournament Bracket Generator** creates brackets for kumite (sparring) competitions.

Together, they form a complete system for karate tournament organization, scoring, and management.

## Future Enhancements

Planned future enhancements include:
- Data persistence (local storage or backend database)
- Tournament management features (multiple divisions, competitor database)
- Export/import functionality between applications
- Support for team competitions
- Integration with registration systems
- Support for different tournament formats (double elimination, round-robin)
- Mobile app versions for on-the-go tournament management

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
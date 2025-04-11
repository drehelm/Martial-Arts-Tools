# Karate Scoring System Requirements

This document outlines the requirements and logic for the three complementary web applications that make up the Karate Scoring System: the Karate Ref Scoresheet, the Karate Division Calculator, and the Karate Tournament Bracket Generator.

## Overview

The system consists of three separate web applications that work together to provide a complete solution for karate tournament management:

1. **Karate Ref Scoresheet** - Used by referees to track competitor placements and assign scores during a tournament.
2. **Karate Division Calculator** - Used to aggregate judge scores, detect scoring discrepancies, and calculate final placements.
3. **Karate Tournament Bracket Generator** - Used to create single elimination tournament brackets with support for byes and visualization of the match tree.

## 1. Karate Ref Scoresheet

### Purpose
A tool for karate referees to track competitors, assign rankings, and calculate scores based on those rankings during tournament divisions.

### Core Features

#### Competitor Management
- Initialize with 5 default competitors
- Add new competitors as needed
- Remove competitors
- Each competitor has: ID, name, ticks (rank indicator), status, and score

#### Status Tracking System
- **Empty status**: Default state, competitor has not been placed yet
- **Blue status**: Competitor is being considered for placement/ranking
- **Green status**: Competitor's placement has been finalized

#### Ranking Mechanism
- "Ticks" represent a competitor's rank (more ticks = higher rank)
- Rankings are adjusted through:
  - Increment/decrement buttons (+/-)
  - Direct rank assignment buttons (1st, 2nd, 3rd, 4th)
  - "Max" button (places competitor one rank above current maximum)
- Rankings are visually represented by tick marks (✔️)

#### Score Assignment Logic
- Scores are automatically assigned based on rank according to this mapping:
  ```
  1st place: 9.99
  2nd place: 9.98
  3rd place: 9.97
  4th place: 9.96
  5th place: 9.95
  6th place: 9.95
  7th place: 9.94
  8th place: 9.94
  9th+ place: 9.93
  ```
- "Assign Scores" button calculates and displays the scores based on current ranks

#### Update Process
- "Update" button finalizes competitors with blue status to green status
- This locks in their rankings until manually edited
- Green status competitors can be reverted to blue for editing

#### Confirmation System
- Confirmation dialogs for destructive actions (reset, competitor removal)
- Prevents accidental data loss

### Workflow

1. Add/remove competitors as needed for the tournament division
2. Assign initial rankings using +/- or direct rank buttons (changes status to blue)
3. Use "Update" to finalize rankings (changes blue status to green)
4. Use "Assign Scores" to calculate and display final scores
5. Edit as needed (reverts competitors from green back to blue for changes)
6. Reset for the next division when complete

## 2. Karate Division Calculator

### Purpose
A tool to calculate and aggregate scores for karate tournament competitors, handle score discrepancies, and determine final placements.

### Core Features

#### Competitor Management
- Initialize with 5 default competitors
- Add new competitors as needed
- Remove competitors
- Each competitor has: ID, name, three scores, total points, placement

#### Scoring System
- Each competitor receives 3 scores (typically from 3 judges)
- Scores range from 9.93 to 9.99, adjustable in 0.01 increments
- Scores are converted to points according to this mapping:
  ```
  9.99 = 0 points
  9.98 = 1 point
  9.97 = 2 points
  9.96 = 3 points
  9.95 = 4 points
  9.94 = 5 points
  9.93 = 6 points
  ```
- Total points are calculated by summing the points for all three scores
- Lower total points are better (first place has the lowest points)

#### Score Discrepancy Detection
- Identifies outlier scores (more than 0.02 away from both other scores)
- Suggests adjustments to bring outliers within the acceptable range
- For high outliers: suggests adjusting down to mid score + 0.02
- For low outliers: suggests adjusting up to mid score - 0.02
- Tracks score history and reasons for adjustments

#### Tie-Breaking Logic
- When competitors have the same total points, ties are broken by the number of highest individual scores
- Displays tie-break explanation message when the tie-breaking mechanism is applied

#### Placement Calculation
- Ranks competitors by total points (ascending)
- Secondary sorting by number of highest scores (descending) for tie-breaking
- Assigns placement numbers (1st, 2nd, 3rd, etc.) based on this ranking

#### Debugging Features
- Optional debug mode showing detailed calculation information
- Score history tracking to maintain an audit trail of score changes

### Workflow

1. Add competitors and input their names
2. Adjust their three scores using the +/- buttons
3. Use "Calculate Scores" to determine placement
4. Address any score discrepancies (accept or reject suggestions)
5. View final placements and any tie-breaks that were applied
6. Reset for the next division when complete

## 3. Karate Tournament Bracket Generator

### Purpose
A tool to create and visualize single elimination tournament brackets, automatically handling byes when the number of competitors is not a power of 2. The primary focus is simplicity, enabling tournament organizers to print blank bracket templates that can be filled in manually.

### Core Features

#### Simplified Bracket Generation
- Generate tournament brackets based solely on the number of competitors
- No requirement to input actual competitor names or details
- Support for varying numbers of competitors (not just powers of 2)
- Clearly designate blank spaces for competitor names to be filled in manually
- Option to enter competitor information for more advanced usage (optional feature)

#### Bracket Generation Logic
- Automatically calculate the number of rounds based on competitor count
- Determine the number of byes needed to complete the bracket
- Distribute byes fairly throughout the bracket
- Generate a complete single elimination tournament tree

#### Visual Bracket Representation (High Priority)
- Display a clean, professional bracket template with blank spaces for competitor names
- Use clear, visually distinct lines and connectors between matches
- Implement responsive design to ensure bracket is readable on different screen sizes
- Show all matches and advancement paths with ample spacing
- Clearly indicate byes in the bracket with special formatting
- Include blank spaces for recording match results
- Enable zooming/panning for larger brackets

#### Paper-Friendly Printing (High Priority)
- Generate print-optimized views of the bracket
- Support for different paper sizes (Letter, A4, etc.)
- Automatic pagination for larger brackets that span multiple pages
- Include optional header with tournament name and date
- Print preview functionality
- Export options (PDF for printing)
- Optimize for black and white printing (pencil-friendly)
- Option for minimal design to save ink

#### Match Management
- Provide blank spaces for recording match results manually
- Simple design optimized for pencil entry
- Ability to record winners manually (no electronic tracking required)
- Highlight current and upcoming matches

#### Tournament Progression
- Clear visual indication of tournament rounds
- Blank spaces for final placements
- Simple, intuitive design for manual tournament progression

### Workflow

1. Input only the number of competitors
2. Generate a blank bracket template with appropriate byes
3. View the bracket with a clean, professional visual representation
4. Adjust the visual display as needed (zoom, pan, layout options)
5. Print or export the blank template
6. Use the printed template for manual tournament management with pencil and paper
7. Optionally, enter competitor names if desired before printing

## Integration Between Applications

While these applications are currently separate, they represent complementary functions in a karate tournament management workflow:

1. **Karate Ref Scoresheet** is primarily used for the ranking/judging phase to determine competitor placements and assign scores based on those placements.

2. **Karate Division Calculator** is used for the technical calculation phase, where individual judge scores are aggregated, checked for discrepancies, and final placements are calculated.

3. **Karate Tournament Bracket Generator** is used for the tournament organization phase, creating brackets and tracking match progression for kumite (sparring) competitions.

Together, they form a complete system for karate tournament organization, scoring, and management.

## Technical Requirements

All three applications are built with:
- React.js as the frontend framework
- Tailwind CSS for styling
- Shadcn UI components
- Mobile-friendly responsive design

## Potential Future Enhancements

1. Data persistence (local storage or backend database)
2. Tournament management features (multiple divisions, competitor database)
3. Export/import functionality between applications
4. Print-optimized views for scoresheets and brackets
5. Support for team competitions
6. Integration with registration systems
7. Support for different tournament formats (double elimination, round-robin)
8. Mobile app versions for on-the-go tournament management
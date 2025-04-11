# Karate Score Calculator

This project is a React.js web application designed to calculate and rank scores for karate tournament competitors.

## Features
- **Add/Remove Competitors**: Start with 5 competitors and adjust as needed.
- **Score Input with Steppers:** Adjust scores using +/- buttons.
- **Placement Calculation:** Automatically ranks competitors based on total points.
- **Tie-Breaking Logic:** Uses highest individual scores as a tie-breaker.
- **Score Discrepancy Warnings:** Flags outlier scores and suggests adjustments.
- **Score History:** Logs and displays changes to competitor scores.
- **Debug Mode:** Displays detailed score calculations for troubleshooting.

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/karate-score-calculator.git
   cd karate-score-calculator
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

## Usage
- Use the "Add Competitor" button to add new competitors.
- Enter competitor names and adjust scores with the provided buttons.
- Click "Calculate Scores" to determine placements.
- Enable "Show Debug" for detailed calculations.

## Deployment
To build the application for production:
```bash
npm run build
```
Deploy the contents of the `build/` directory to your web server or hosting service.

## Technologies Used
- **React.js:** Front-end framework
- **Tailwind CSS:** Styling
- **Shadcn UI:** Pre-built components

## Contributing
Contributions are welcome! Please open issues or pull requests as needed.

## License
This project is licensed under the MIT License.

---

**Maintainer:** herrkutt

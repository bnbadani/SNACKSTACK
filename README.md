# Nutrition Tracker - Personal Calorie & Nutrition Management

A modern, responsive web application for personalized calorie and nutrition tracking with user profiles, daily calorie goals, and comprehensive analytics. Built with vanilla JavaScript, Express.js, and Chart.js.

## Features

### Core Functionality
- **User Profiles**: Personal information with age, gender, height (feet & inches), weight (pounds)
- **Calorie Goals**: Personalized daily calorie recommendations based on user goals
- **Goal Options**: Weight loss, weight gain, or maintain current weight
- **Activity Levels**: Sedentary to extra active lifestyle considerations
- **Meal Logging**: Add meals with detailed nutritional information
- **Meal Management**: View, edit, and delete logged meals
- **Daily Tracking**: Real-time calorie intake progress with visual indicators
- **Real-time Filtering**: Filter meals by date, type, or food name
- **Nutritional Statistics**: Comprehensive analytics with interactive charts
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Interactive Features
- **Live Dashboard**: Real-time updates of daily nutrition totals and calorie goal progress
- **Progress Tracking**: Visual progress bars showing daily calorie goal achievement
- **BMR Calculator**: Automatic calculation of Basal Metabolic Rate
- **BMI Tracking**: Body Mass Index calculation and categorization
- **Interactive Charts**: Visual representation of nutrition data using Chart.js
- **Form Validation**: Real-time input validation with user-friendly error messages
- **Search & Filter**: Dynamic meal filtering with instant results
- **Modal Editing**: Convenient in-page meal editing
- **Toast Notifications**: User feedback for all actions

### Technical Features
- **RESTful API**: Clean backend API for all operations
- **Data Persistence**: JSON file-based storage (easily upgradeable to database)
- **Mobile-First Design**: Responsive CSS with modern layouts
- **Accessibility**: WCAG 2.1 AA compliant design
- **Performance**: Optimized loading and smooth animations

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Backend**: Node.js, Express.js
- **Charts**: Chart.js
- **Storage**: JSON files (file system)
- **Styling**: Custom CSS with Flexbox/Grid

## Quick Start

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Installation

1. **Clone or extract the project files**
   ```bash
   cd nutritrack-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Development Mode

For development with auto-restart:
```bash
npm run dev
```

## Usage Guide

### Adding a Meal
1. Click on the "Add Meal" tab
2. Fill in all required fields:
   - Food Name (e.g., "Grilled Chicken Breast")
   - Calories (e.g., 250)
   - Protein in grams (e.g., 25.5)
   - Carbs in grams (e.g., 15.2)
   - Fats in grams (e.g., 8.3)
   - Date (defaults to today)
   - Meal Type (Breakfast, Lunch, Dinner, or Snack)
3. Click "Add Meal"

### Viewing and Managing Meals
1. Go to the "My Meals" tab
2. Use filters to find specific meals:
   - Filter by date
   - Filter by meal type
   - Search by food name
3. Edit or delete meals using the action buttons

### Viewing Statistics
1. Navigate to the "Statistics" tab
2. Adjust the date range if needed
3. View comprehensive analytics including:
   - Total and average daily calories
   - Macronutrient breakdown
   - Meal type distribution
   - Daily trends

### Dashboard Overview
The dashboard provides a quick overview of:
- Today's nutritional totals
- Recent meals
- Weekly calorie trends

## API Endpoints

### Meals
- `GET /api/meals` - Get all meals (with optional filters)
- `GET /api/meals/:id` - Get a specific meal
- `POST /api/meals` - Add a new meal
- `PUT /api/meals/:id` - Update a meal
- `DELETE /api/meals/:id` - Delete a meal

### Statistics
- `GET /api/statistics` - Get nutrition statistics (with optional date range)

### Query Parameters
- `date` - Filter by specific date (YYYY-MM-DD)
- `mealType` - Filter by meal type
- `search` - Search in food names
- `startDate` - Statistics start date
- `endDate` - Statistics end date

## Project Structure

```
nutritrack-web/
├── server.js              # Express server and API routes
├── package.json           # Dependencies and scripts
├── PRD.md                # Product Requirements Document
├── README.md             # This file
├── data/                 # Data storage directory
│   └── meals.json        # Meal data (created automatically)
└── public/               # Frontend files
    ├── index.html        # Main HTML file
    ├── styles.css        # CSS styles
    └── app.js           # Frontend JavaScript
```

## Data Format

Meals are stored in the following format:
```json
{
  "transactionId": "abc12345",
  "foodName": "Grilled Chicken Breast",
  "calories": 250,
  "protein": 25.5,
  "carbs": 15.2,
  "fats": 8.3,
  "date": "2024-12-08",
  "mealType": "Lunch",
  "createdAt": "2024-12-08T10:30:00.000Z"
}
```

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Performance

- Page load time: < 2 seconds
- Mobile-optimized with responsive design
- Efficient data filtering and search
- Smooth animations and transitions

## Security

- Input validation on both frontend and backend
- CORS protection
- Error handling and graceful degradation
- Data sanitization

## Future Enhancements

- User authentication and multi-user support
- Cloud data synchronization
- Food database integration
- Barcode scanning capability
- Goal setting and achievement tracking
- Export to PDF/CSV
- Social sharing features
- Integration with fitness trackers

## Troubleshooting

### Common Issues

1. **Server won't start**
   - Check if Node.js is installed: `node --version`
   - Ensure port 3000 is available
   - Check for installation errors: `npm install`

2. **Data not saving**
   - Ensure the `data` directory exists and is writable
   - Check server logs for errors

3. **Charts not displaying**
   - Ensure internet connection (Chart.js loads from CDN)
   - Check browser console for JavaScript errors

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Check the server logs in the terminal
3. Ensure all dependencies are installed correctly
4. Verify that the data directory has write permissions

## License

This project is licensed under the MIT License - see the package.json file for details.

## Acknowledgments

- Chart.js for beautiful, responsive charts
- Inter font family for clean typography
- Express.js for the robust backend framework
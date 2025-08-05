# EPCarpool 🚗🌱

[![Live Site](https://img.shields.io/badge/Live%20Site-epcarpool.com-blue)](https://www.epcarpool.com)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248.svg)](https://mongodb.com)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

**A sustainable carpooling platform for Eastside Preparatory School students to share rides to school events while reducing their carbon footprint.**

## 🌟 About

EPCarpool was born from the first EPS Hackathon in January 2024, addressing the challenge: "How can we make EPS more sustainable?" Rather than just raising awareness, we chose to create a practical solution that empowers students to take direct climate action through carpooling.

The platform enables students to coordinate rides for school events—sports games, academic competitions, social gatherings, and more—transforming transportation into a collaborative, eco-friendly experience that builds community while protecting the environment.

## ✨ Key Features

### 🚗 **Smart Carpooling System**
- **Create & Join Carpools**: Organize rides for any EPS event with detailed route information
- **Intelligent Matching**: Get personalized carpool recommendations based on your interests (sports, academics, social events)
- **Real-time Management**: Handle passenger requests, track available seats, and manage your carpools

### 🌍 **Environmental Impact Tracking**
- **CO2 Savings Calculator**: Automatically calculate environmental impact using EPA emission standards (0.404 kg CO2/mile)
- **Personal Impact Dashboard**: Track your cumulative CO2 savings over time
- **Visual Equivalents**: See your impact in relatable terms (plastic bottles, rice servings equivalent)
- **Community Goals**: Work together toward school-wide sustainability targets

### 🗺️ **Location & Route Features**
- **Interactive Maps**: Visualize pickup routes and event locations using Leaflet mapping
- **Address Geocoding**: Automatic conversion of addresses to coordinates for accurate routing
- **Distance Calculation**: Smart algorithms to optimize routes and calculate travel distances

### 👤 **User Experience**
- **Secure Authentication**: Firebase-powered login system with EPS email verification
- **Personalized Settings**: Customize notification preferences and interests
- **Event Categories**: Filter by sports, academic, social, and other event types
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### 🛡️ **Safety & Security**
- **School Email Verification**: Restricted to verified EPS students and staff
- **Rate Limiting**: Protection against abuse with intelligent request throttling
- **Data Privacy**: Secure handling of personal information and location data
- **Admin Controls**: Administrative oversight for platform management

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v22.x or higher)
- [MongoDB](https://www.mongodb.com/) database
- Firebase service account credentials
- EPS email account for authentication

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/EPSpaces/EPShareRides.git
   cd EPShareRides
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   
   Contact the development team for required configuration files:
   - `.env` - Environment variables
   - `service_account.json` - Firebase credentials
   - `config.js` - Application configuration
   
   📧 Contact: ajosan@eastsideprep.org, nmahesh@eastsideprep.org, ayamashita@eastsideprep.org

4. **Set development mode**
   ```bash
   # In your .env file
   MODE=DEV
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```
   
   The application will start at `http://localhost:3000` with hot reloading via nodemon.

### Production Deployment
```bash
npm start
```

The app is configured for Google Cloud Platform deployment with automatic scaling.

## 🏗️ Architecture

### Technology Stack
- **Backend**: Node.js with Express.js framework
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Firebase Authentication
- **Frontend**: EJS templating with Bulma CSS framework
- **Maps**: Leaflet.js for interactive mapping
- **Testing**: Jest with Supertest for API testing
- **Deployment**: Google Cloud Platform App Engine

### Project Structure
```
EPShareRides/
├── index.js                 # Main server file
├── package.json             # Dependencies and scripts
├── app.yaml                 # GCP deployment configuration
├── jest.config.js           # Test configuration
│
├── routes/                  # Express route handlers
│   ├── apiRoutes.js        # API endpoints for carpools, events, CO2 tracking
│   └── authRoutes.js       # Authentication routes
│
├── schemas/                 # MongoDB data models
│   ├── User.model.js       # User account information
│   ├── Carpool.model.js    # Carpool details and participants
│   ├── Event.model.js      # School events
│   └── UserSettings.model.js # User preferences
│
├── utils/                   # Utility functions
│   ├── authUtils.js        # JWT authentication helpers
│   ├── co2Calculator.js    # Environmental impact calculations
│   ├── distanceUtils.js    # Route distance calculations
│   ├── geoUtils.js         # Geocoding and location services
│   └── studentUtils.js     # Student data processing
│
├── public/                  # Static frontend assets
│   ├── js/                 # Client-side JavaScript
│   ├── style.css           # Custom styling
│   ├── bulma.min.css       # UI framework
│   └── *.js                # Feature-specific scripts
│
├── views/                   # EJS templates
│   ├── index.ejs           # Dashboard homepage
│   ├── mycarpools.ejs      # Personal carpool management
│   ├── findrides.ejs       # Browse available rides
│   └── *.ejs               # Additional pages
│
└── __tests__/              # Test suites
    └── *.test.js           # Jest test files
```

## 🧪 Testing

Run the comprehensive test suite:
```bash
npm test
```

Tests cover:
- API endpoint functionality
- Carpool recommendation algorithms
- CO2 calculation accuracy
- Authentication flows
- Database operations

## 🌱 Environmental Impact

EPCarpool calculates real environmental benefits:

- **CO2 Reduction**: Uses EPA standards (0.404 kg CO2 per mile) for accurate calculations
- **Passenger Sharing**: Each additional passenger significantly reduces per-person emissions
- **Visual Impact**: Converts savings to understandable equivalents
- **Community Goals**: Tracks school-wide progress toward sustainability targets

### Example Impact
A 4-person carpool for a 20-mile round trip saves approximately **2.42 kg CO2** compared to driving separately—equivalent to the CO2 used in producing 29 plastic water bottles!

## 🤝 Contributing

We welcome contributions from the EPS community! Here's how to get involved:

### Development Guidelines

**Code Style**:
- Follow JavaScript/Node.js best practices
- Use `camelCase` for variables and functions
- Use `PascalCase` for classes and models
- Write descriptive commit messages
- Include tests for new features

**Architecture Patterns**:
- Organize routes by functionality in separate files
- Use MongoDB/Mongoose patterns for database operations
- Implement async/await for asynchronous operations
- Handle errors with comprehensive try/catch blocks
- Comment complex business logic and algorithms

### How to Contribute

1. **Fork the repository** and create a feature branch
2. **Make your changes** following the style guidelines
3. **Add tests** for any new functionality
4. **Run the test suite** to ensure everything works
5. **Submit a pull request** with a clear description of changes

### Reporting Issues
Found a bug or have a feature request? Please create an issue with:
- Clear description of the problem/request
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Screenshots if applicable

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

EPCarpool is developed and maintained by EPS students and faculty:

- **Development Team**: Contact ajosan@eastsideprep.org, nmahesh@eastsideprep.org, ayamashita@eastsideprep.org
- **Community**: All EPS students and staff

## 🙏 Acknowledgments

- **EPS Hackathon 2024** - Where the idea was born
- **Eastside Preparatory School** - For supporting student innovation
- **Environmental Protection Agency** - For CO2 emission standards
- **Open Source Community** - For the amazing tools and libraries

---

**Ready to reduce your carbon footprint while connecting with your EPS community? Start carpooling today!** 🌍🚗

Visit us at [epcarpool.com](https://www.epcarpool.com) or contact the development team for questions and support.

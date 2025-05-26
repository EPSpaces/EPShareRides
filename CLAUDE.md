# EPCarpool Development Guide

## Commands
- Start development server: `npm run dev`
- Start production server: `npm start`
- Install dependencies: `npm install`
- Run in Docker: `docker-compose up`

## Project Structure
- Backend: Express.js with EJS templates
- Database: MongoDB with Mongoose ODM
- Authentication: Auth0 (express-openid-connect), JWT
- Key directories: routes/, schemas/, views/, utils/

## Code Style Guidelines
- Use camelCase for variables and functions
- Use PascalCase for classes and models
- Organize routes in separate files based on functionality
- Follow MongoDB/Mongoose patterns for database operations
- Use async/await for asynchronous operations
- Handle errors with try/catch blocks
- Comment complex logic and business rules

## Security Practices
- Validate user input with Mongoose schemas
- Implement rate limiting for API endpoints
- Use JWT for authentication
- Never expose sensitive credentials in code

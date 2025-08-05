# [EPCarpool](https://www.epcarpool.com) - [https://www.epcarpool.com](https://www.epcarpool.com)
The idea for EPCarpool was born at the first EPS Hackathon in January of 2024. The prompt for that competition was "How can we make EPS more sustainable?".
There are many ways we could approach this topic: We could build a website to raise awareness or we could greenify a component of EPS, but we decided to focus on the student life aspect of sustainability. How can students at EPS engage in climate-friendly actions, and how can they integrate it into a convenient lifestyle?
EPCarpool is a place that allows students to engage directly in lowering the footprint from transportation for school events: socials, sports, academic teams, and more. It allows us to work together to make EPS extracurriculars a more sustainable part of our culture and to promote greener ways of transportation. We see the value in carpooling, and we hope you do as well.


The vision of such a applicaiton is to allow for easier communication on carpooling to EPS based events.

## Running the app
Download node.js. Then, clone the repository and run:
```
npm i
```
Add in the .env file, service_account.json, and config.js (email ajosan@eastsideprep.org, nmahesh@eastsideprep.org, ayamashita@eastsideprep.org). Make sure the MODE is set to DEV.  Then, run
```
npm run dev
```
and the app will start in dev using nodemon.

## Project Structure
- `index.js`: Initializes the Express server, sets up routes, and handles various functionalities.
- `package.json`: Lists the dependencies and scripts for the project.
- `public/`: Contains static files such as CSS, JavaScript, and configuration files.
- `routes/`: Contains route handlers for API and authentication.
- `schemas/`: Contains Mongoose schemas for the database models.
- `utils/`: Contains utility functions for authentication.

## Contributing
1. **Code Style Guidelines**:
   - Use camelCase for variables and functions.
   - Use PascalCase for classes and models.
   - Organize routes in separate files based on functionality.
   - Follow MongoDB/Mongoose patterns for database operations.
   - Use async/await for asynchronous operations.
   - Handle errors with try/catch blocks.
   - Comment complex logic and business rules.

2. **Submitting Issues**: Just do it, make it helpful

3. **Creating Pull Requests**: Yes

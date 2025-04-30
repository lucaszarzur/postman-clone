# Postman Clone

A powerful web-based alternative to Postman with advanced support for API collections, environments, authentication, and automated testing.

## Features

### Collections & Environments
- Import and manage Postman collections
- Import and manage Postman environments
- Environment variable management with global and environment-specific variables
- CSV export of test results

### API Testing
- Run test sequences with multiple parameter sets
- Bulk add test parameters with semicolon-separated format
- Sequential API request execution with dependency chains
- Disable specific requests in test sequences
- Visual separation between completed test sequences
- Stop and continue functionality for test runs

### Authentication
- Global authentication with username/password variables
- Variable substitution with {{user}} and {{password}} in requests
- Auto-fill authentication from environment variables
- Authentication support in both request editor and test runner

### Scripting & Debugging
- Pre-request scripts for request modification
- Test scripts with Chai assertion library
- Console component for request/response logging
- Detailed request body information in API call details

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
```bash
git clone https://github.com/lucaszarzur/postman-clone.git
cd postman-clone
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables (optional)
```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your API target
# VITE_API_TARGET=https://your-api-url.com
```

4. Start the development server
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## Usage

### Importing Collections and Environments

1. Click on the "Import Collection" button in the Collections tab
2. Select a Postman collection JSON file
3. Click on the "Import Environment" button in the Environments tab
4. Select a Postman environment JSON file

### Making Requests

1. Select a request from the collection sidebar
2. Modify the request if needed
3. Click the "Send" button
4. View the response in the response panel

### Using Environment Variables

1. Create or import an environment
2. Select the environment from the dropdown at the top
3. Use variables in your requests with the `{{variableName}}` syntax
4. View and edit variables in the Environments tab

### Authentication

The application supports global authentication that can be applied to all requests:

1. In the Test Runner, find the Authentication section
2. Enable global authentication by checking the checkbox
3. Enter your username and password
4. Use `{{user}}` and `{{password}}` variables in your requests

Authentication options:

- **Auto-fill**: Automatically fill username and password fields from environment variables
- **Default values**: Use default values (admin/admin) for quick testing
- **Environment variables**: Authentication credentials can be stored in environment variables
- **Global variables**: Authentication settings apply to both request editor and test runner

### Running Tests in Request Editor

1. Add test scripts to your requests
2. Send the request
3. View test results in the "Tests" tab of the response panel

### Using the Test Runner

1. Switch to the Test Runner mode using the toggle at the top of the application
2. Select a collection from the dropdown
3. Add test parameters:
   - Click "Add Parameter Set" to add individual parameter sets
   - Or use "Bulk Add" to paste multiple origin/destination pairs in semicolon-separated format (e.g., "14199;3155")
4. Configure which requests to include in the test sequence by toggling them on/off
5. Click "Run Collection" to execute the test sequence with all parameter sets
6. View the test results in the results panel

#### Test Parameters

The Test Runner supports adding multiple parameter sets to run the same collection with different input values:

- Parameters must be numeric IDs when used for origin/destination pairs
- Each parameter set creates a separate test run
- When using bulk add, use the format `origin;destination` with one pair per line
- You can enable/disable specific parameter sets

#### Test Sequence Execution

When running a collection:

1. Requests are executed in sequence
2. Each request waits for the previous one to complete
3. Pre-request scripts are executed before each request
4. Test scripts are executed after each request
5. Environment variables set by test scripts are available to subsequent requests
6. If a request fails, the sequence continues with the next request
7. If a specific error condition is met (like empty services), only that parameter set is stopped

### Using the Console

The console provides detailed logging of all API requests and responses:

1. Click the "Console" button at the bottom of the screen to open the console
2. View request and response details, including headers, body, and timing information
3. Filter logs by type (info, request, response, error, warning)
4. Search logs using the search box
5. Clear logs using the trash icon

## Running in Production

To run the application in production mode:

1. Build the application
```bash
npm run build
```

2. Start both the proxy server and the application
```bash
npm run start
```

This will start:
- The proxy server on port 3000 (http://localhost:3000)
- The Vite preview server on port 4173 (http://localhost:4173)

## Environment Variables

The application uses the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| VITE_API_TARGET | The target API URL for the proxy server |

You can set these variables in a `.env` file in the root of the project.

## Built With

- [React](https://reactjs.org/) - Frontend framework
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Axios](https://axios-http.com/) - HTTP client
- [Express](https://expressjs.com/) - Used for the proxy server
- [Chai](https://www.chaijs.com/) - Assertion library for tests
- [React Icons](https://react-icons.github.io/react-icons/) - Icon library
- [React Toastify](https://fkhadra.github.io/react-toastify/) - Toast notifications

## Contributing

Contributions are welcome! Here are some ways you can contribute:

1. Report bugs and issues
2. Suggest new features
3. Submit pull requests with improvements
4. Improve documentation

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by [Postman](https://www.postman.com/)
- Thanks to all contributors who have helped improve this project

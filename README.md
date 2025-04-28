# Postman Clone

A web-based alternative to Postman with support for collections, environments, and test scripts.

## Features

- Import Postman collections
- Import Postman environments
- Execute API requests with variable substitution
- Run pre-request scripts
- Run test scripts that can populate environment variables
- View and manage environment variables
- View test results

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

### Running Tests

1. Add test scripts to your requests
2. Send the request
3. View test results in the "Tests" tab of the response panel

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

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by [Postman](https://www.postman.com/)

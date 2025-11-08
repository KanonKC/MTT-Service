## Features

- **LINE Integration**: Receive and process lesson updates via LINE webhook
- **Google Drive Integration**: Manage book PDFs and cover images
- **AI-Powered Book Recognition**: Automatically extract book details and match covers using Google Gemini AI
- **Lesson Management**: Store and retrieve lessons with class level, subject, and associated books
- **Automated Book Import**: Daily cron job to import book data from Google Drive
- **Google OAuth**: Secure authentication for Google services

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Fastify
- **Database**: MySQL with Prisma ORM
- **AI**: Google Gemini API
- **Storage**: Google Drive API
- **Messaging**: LINE Messaging API
- **Cron Jobs**: node-cron

## Prerequisites

- Node.js (v20 or higher)
- MySQL database
- Google Cloud credentials (OAuth 2.0)
- LINE Messaging API access token
- Google Gemini API key

## Installation

1. Clone the repository
2. Install Node.js dependencies:
    ```
    npm install
    ```
3. Set up Prisma:
    ```
    npx prisma generate
    npx prisma migrate dev
    ```
4. Configure Google OAuth credentials
    - Create `credentials.json` with Google OAuth credentials. You can follow from this [instruction](https://developers.google.com/workspace/drive/api/quickstart/nodejs#set-up-environment)
    - Set `redirect_uris` to redirect to your server. For example, if your server is running on `http://localhost:3000`, set `redirect_uris` to `http://localhost:3000/oauth2callback`
    - Set `scopes` to be the following:
      - `https://www.googleapis.com/auth/drive.metadata`
      - `https://www.googleapis.com/auth/drive`
5. Generate Google OAuth token
   - Run server in development mode:
        ```
        npm run dev
        ```
    - Generate Google OAuth login URL:
        ```
        npm run login
        ```
    - Open the generated URL in your browser and follow the instructions to authorize the application.
    - Once completed, `token.json` will be created in the root directory. Make sure that it contains `refresh_token` inside.
6. Register LINE webhook
    - Run server in development mode:
        ```
        npm run dev
        ```
    - Go to [LINE Developers console](https://developers.line.biz/en/) and create a new webhook using webhook URL:
        ```
        https://<your-server-url>/line/webhook
        ```
        then click on "Verify" button. It should display green checkmark.
7. Configure environment
    - `HOST` - variable for server URL. This should be public accessible URL, otherwise LINE webhook will not working.
    - `PORT` - variable for server port.
    - `TIME_ZONE` - variable for server time zone. Use **IANA Time Zone** format.
    - `DATABASE_URL` - variable for MySQL connection. Please follow this format:
        ```
        mysql://<username>:<password>@<host>:<port>/<database_name>
        ```
    - LINE environment variables:
      - `LINE_ACCESS_TOKEN` - variable for LINE Messaging API access token. This will allow service to send message from LINE channel. You can get it from [LINE Developers console](https://developers.line.biz/en/).
    - Google Gemini environment variables:
      - `GEMINI_API_KEY` - variable for Google Gemini API key.
      - `GEMINI_MODEL` - variable for Google Gemini model.
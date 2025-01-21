## Description

Microservice to calculate APY (Annual Percentage Yield). This service periodically queries the blockchain to retrieve
vault data, calculates APY, and saves the results.

## Project Setup

### Install Dependencies

```bash
$ npm install
```

### Create an `.env` File

Provide the necessary environment variables in a `.env` file:

```.dotenv
APPLICATION_PORT=4000
APPLICATION_URL=http://localhost:${APPLICATION_PORT}
APPLICATION_ORIGIN=http://localhost:3000,https://lemonjet.io/

SUPABASE_URL=
SUPABASE_KEY=

SUI_VAULT_ADDRESS=
SUI_GRAPHQL_URL="https://sui-testnet.mystenlabs.com/graphql"
```

### Adjust Query Schedule

To change the scheduling period for blockchain queries, edit the `TRACKER_CRON_SCHEDULE` constant in
`src/data/constants.ts`.

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## API Endpoints

### Get APY

- **Endpoint:** `GET http://localhost:4000/apy`
- **Response Example:**

```json
{
  "apy": 1.94947
}
```


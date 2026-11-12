# North / Form

A full-stack clothing-store prototype with a React storefront and an Express API. The storefront includes product browsing, search, a saved bag, account screens, and a checkout flow. The API uses MongoDB and can connect to Stripe and Resend when configured.

## Run locally

Install dependencies for the root scripts, client, and server:

```sh
npm install
npm install --prefix client
npm install --prefix server
```

Copy `server/.env.example` to `server/.env` and set the values needed for the features you want to test. The API needs a MongoDB connection and a JWT secret; Stripe checkout and email delivery also need their own credentials.

Start the client and API together:

```sh
npm run dev
```

The client runs at `http://localhost:5173` and the API at `http://localhost:5000`. The sample catalog is in the client code; database-backed product listings require the API and MongoDB to be configured.

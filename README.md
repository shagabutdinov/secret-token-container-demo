# Intro

This is a demonstration of a secret token container approach resistant to XSS attacks.

The idea is to atomically transfer the token from the secret storage (e.g. HTTP-cookie) to an isolated application memory. The secret token is exposed via wrapper function to the rest of the application. The transfer should happen in a synchronous mode before any other requests (e.g. img, styles, and etc.) are made on the page.

Together with content security policy, this approach should provide a sufficient level of protection against XSS attacks.

# Installation

1. Clone the repository
2. Run `npm install`
3. Run `npm start`

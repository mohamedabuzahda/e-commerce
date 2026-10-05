# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

## Google sign-in

Set `VITE_GOOGLE_CLIENT_ID` in the Vercel project environment variables for every
deployment environment, then redeploy. Add the deployed site origin to the
authorized JavaScript origins in Google Cloud Console. The API must expose
`POST /api/Auth/google-login`, accept `{ "idToken": "<Google ID token>", "role": "Customer" }`,
and return an access token and account email. Facebook sign-in remains disabled
until the application has a Facebook App ID and a matching API endpoint.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

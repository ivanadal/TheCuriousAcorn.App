# The Curious Acorn App

Kid-friendly Angular app that identifies leaves from photos and explains results in age-appropriate language.

## What this app does

- Authenticates users with Google Sign-In.
- Protects the dashboard route behind authentication.
- Lets users capture or upload a leaf photo.
- Sends the image to the backend for analysis.
- Supports language-specific analysis in English, Spanish, and Serbian.
- Lets users choose age groups (default: 4-6 years).
- Optionally reads results aloud using browser speech synthesis.

## Tech stack

- Angular 21 (standalone components)
- TypeScript 5.9
- RxJS 7.8
- Angular build tooling + Vitest unit test runner

## App flow

1. User lands on `/login`.
2. App bootstraps and loads remote config from backend (`/api/auth/config`).
3. Google Sign-In button initializes using `googleClientId` from backend config.
4. On successful login, auth token is stored in local storage.
5. User is redirected to `/dashboard` (guarded by `authGuard`).
6. User captures a leaf image and app calls language-specific analysis endpoint.
7. Result view shows `leafName`, `explanation`, and `funFact`.

## Routes

- `/login` -> Login page
- `/dashboard` -> Leaf finder page (requires auth)
- `/` -> Redirects to `/login`

Router uses hash location strategy, so URLs look like:

- `http://localhost:4200/#/login`
- `http://localhost:4200/#/dashboard`

## Project structure

```text
src/
	app/
		auth/
			auth.guard.ts
			auth.interceptor.ts
		leaf-finder/
			leaf-finder.ts
			leaf-finder.html
			leaf-finder.css
		login/
			login.ts
			login.html
			login.css
		services/
			auth.service.ts
			config.service.ts
			leaf-finder.service.ts
			api-error.service.ts
			app.initializer.ts
		app.config.ts
		app.routes.ts
	environments/
		environment.ts
		environment.prod.ts
```

## Prerequisites

- Node.js 20+
- npm 11+
- Running backend API (see API contract below)

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm start
```

3. Open:

```text
http://localhost:4200/#/login
```

## Scripts

- `npm start` - run local dev server
- `npm run build` - production build
- `npm run watch` - build in watch mode (development config)
- `npm test` - run unit tests

## Environment configuration

Development (`src/environments/environment.ts`):

- `production: false`
- `apiUrl: http://localhost:5002/api`
- `apiBaseUrl: http://localhost:5002`

Production (`src/environments/environment.prod.ts`):

- `production: true`
- `apiUrl: /api`
- `apiBaseUrl: ''`

## Backend API contract expected by this frontend

### Authentication and config

- `GET /api/auth/config`
	- Returns app config object with at least:
		- `googleClientId: string`
		- `apiUrl: string`
		- `production: boolean`

- `POST /api/auth/google-login`
	- Request body:

```json
{
	"token": "<google-credential-token>"
}
```

	- Response must contain token and user data. Frontend accepts multiple token field names (for resilience), but should include a stable auth token and user payload.

### Leaf analysis

- `POST /api/leafanalysis/analyze` (English)
- `POST /api/leafanalysis/analyze/es` (Spanish)
- `POST /api/leafanalysis/analyze/sr` (Serbian)

Request body:

```json
{
	"imageBase64": "data:image/jpeg;base64,...",
	"ageGroup": "preschool"
}
```

Expected response:

```json
{
	"leafName": "Maple",
	"explanation": "This leaf has pointed lobes and a classic maple shape.",
	"funFact": "Maple trees can produce syrup from their sap."
}
```

## Authentication behavior

- Auth token and user are stored in local storage as:
	- `authToken`
	- `user`
- All HTTP requests automatically include `Authorization: Bearer <token>` when token exists.
- On `401 Unauthorized`, auth state is cleared and app redirects to login.

## Reliability features already implemented

- Config loading retries with timeout and safe fallback.
- Leaf analysis request timeout (45 seconds) and one retry.
- Centralized API error-to-user-message mapping.
- Response shape validation for both auth and leaf analysis responses.

## Notes for contributors

- This app currently depends on a backend running at `http://localhost:5002` in development.
- Public assets are served from the `public/` folder.
- Routing is hash-based (`withHashLocation`) to simplify static hosting.

## Deployment

Repository includes a GitHub Actions workflow to build and deploy to GitHub Pages.

## License

No license file is currently present in this repository.

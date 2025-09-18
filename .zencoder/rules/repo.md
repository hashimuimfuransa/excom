# Repository Metadata

- name: excom
- stack: **Next.js (frontend)**, **Express + TypeScript + Mongoose (backend)**, **Docker Compose**
- apps:
  - frontend: Next.js app in `frontend/`
  - backend: Express API in `backend/`
- auth: JWT-based; token stored in `localStorage` (`excom_token`)
- roles: `buyer`, `seller`, `admin` (user model `role` field)
- products: Mongoose `Product` includes `images: string[]`, `seller: ObjectId`, `source: 'local' | 'cloudinary'`, timestamps
- endpoints (key):
  - GET `/api/products` — list
  - GET `/api/products/:id` — detail
  - GET `/api/products/mine/list` — seller-only
  - POST `/api/products` — seller/admin create; accepts `images: string[]`
- limits: `express.json({ limit: '10mb' })`
- image upload: planned Cloudinary integration (env needed: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`)
- frontend utils: `frontend/utils/api.ts` provides `apiGet/Post/Patch/Delete`
- seller UI: dashboard exists under `frontend/app/seller/...`, product create page pending
- targetFramework: Playwright

## Setup
- copy `backend/.env.example` to `backend/.env` and fill secrets
- run with Docker Compose or start apps individually

## Next Steps
- Implement Cloudinary upload service in backend and wire into POST `/api/products`
- Build seller product create/edit pages with image uploader
- Polish seller dashboard with metrics and tables
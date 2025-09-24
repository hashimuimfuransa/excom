# Excom Backend (MVP)

Scripts:
- dev: ts-node-dev src/index.ts
- build: tsc
- start: node dist/index.js

Env:
- PORT=4000
- MONGO_URI=mongodb://127.0.0.1:27017/excom
- JWT_SECRET=change_me
- GEMINI_API_KEY=your_key
- MESHY_API_KEY=your_meshy_api_key (for AR/3D model generation)

Routes:
- GET / -> health
- /api/auth [POST /register, POST /login]
- /api/products [GET /, GET /:id, POST /]
- /api/orders [GET /, POST /] (auth)
- /api/sellers [GET /inventory, POST /inventory] (auth)
- /api/ai [POST /chat, POST /recommend, POST /generate-listing]
- /api/search [GET /?q=&type=products|stays]
- /api/payments [POST /create-session] (auth)
- /api/ar [POST /:id/generate-3d, GET /:id/3d-status, POST /:id/upload-3d, DELETE /:id/3d-model, POST /:id/regenerate-3d] (auth)
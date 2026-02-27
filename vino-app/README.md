# 🍷 Vino — Wine Discovery App

A production-ready Vivino-inspired wine discovery and collection app.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js 22, Express, TypeScript, Prisma v7 |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Frontend | React Native, Expo SDK 51, TypeScript |
| Auth | JWT (access 15m + refresh 30d) |
| Image AI | Google Vision API |
| Image storage | Cloudinary |
| CI/CD | GitHub Actions + EAS Build |

## Local Development

### Prerequisites
- Docker & Docker Compose
- Node.js 22+
- [EAS CLI](https://docs.expo.dev/eas/) (for mobile builds)

### 1. Clone & configure

```bash
git clone <repo>
cd vino-app

# Copy and edit the backend env
cp backend/.env.production.example backend/.env.production
# Edit backend/.env.production with your values
```

### 2. Start services

```bash
docker-compose up
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- API server on port 3000

### 3. Run migrations (first time)

```bash
cd backend
npx prisma migrate dev
```

### 4. Start frontend (Expo Go)

```bash
cd frontend
npm install
npx expo start
```

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://vino:pass@localhost:5432/vinodb` |
| `JWT_SECRET` | Access token secret (min 64 chars) | `random-64-char-string` |
| `JWT_REFRESH_SECRET` | Refresh token secret | `another-random-string` |
| `PORT` | API server port | `3000` |
| `LOG_LEVEL` | Winston log level | `info` |
| `NODE_ENV` | Environment | `production` |
| `GOOGLE_VISION_API_KEY` | Google Vision API key (use `stub` for dev) | `AIza...` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name (use `stub` for dev) | `my-cloud` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `abc...` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `CORS_ORIGIN` | Allowed CORS origin | `https://your-app.com` |

## Deployment

### Backend — Railway

1. Push to GitHub
2. Create a new Railway project → "Deploy from GitHub repo"
3. Add a PostgreSQL plugin
4. Set all environment variables from `.env.production.example`
5. Railway auto-deploys on push to `main`

### Frontend — EAS Build

```bash
cd frontend
npm install -g eas-cli
eas login
eas build --platform all --profile production
eas submit --platform all
```

## API Endpoints

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns tokens |
| POST | `/api/auth/refresh` | Exchange refresh token for new access token |

### Wines
| Method | Path | Description |
|---|---|---|
| GET | `/api/wines` | List wines (paginated, filterable) |
| GET | `/api/wines/:id` | Get wine detail |
| POST | `/api/wines` | Create wine (admin) |

### Reviews
| Method | Path | Description |
|---|---|---|
| GET | `/api/reviews?wineId=` | Get reviews for a wine |
| POST | `/api/reviews` | Create/update review |
| DELETE | `/api/reviews/:id` | Delete review |

### Collection
| Method | Path | Description |
|---|---|---|
| GET | `/api/collection` | Get user's collection |
| POST | `/api/collection` | Add wine to collection |
| PATCH | `/api/collection/:itemId` | Update collection item |
| DELETE | `/api/collection/:itemId` | Remove from collection |

### Scanner
| Method | Path | Description |
|---|---|---|
| POST | `/api/scanner/scan` | Scan wine label (base64 image or barcode) |

### Upload
| Method | Path | Description |
|---|---|---|
| POST | `/api/upload` | Upload image, returns Cloudinary URL |

### Health
| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check with DB connectivity |

## Architecture Notes

- **Rate limiting**: 100 req/15min general, 10 req/15min on `/api/auth`
- **Security**: Helmet headers, CORS, input validation via Zod
- **Logging**: Winston — console in dev, JSON files in production
- **Refresh tokens**: SHA-256 hashed, stored in DB, auto-expiry enforced
- **Scanner**: Falls back to stub mode if `GOOGLE_VISION_API_KEY=stub`
- **Image upload**: Falls back to placeholder URL if `CLOUDINARY_CLOUD_NAME=stub`

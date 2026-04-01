# Environment Variables

This document describes all environment variables required for the Fastify API.

## Required Variables

### Database
| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | `https://your-project.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (not anon key) | `eyJhbG...` |

### Google Gemini (for Embeddings)
| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google AI Studio API key for generating embeddings | Required |
| `GEMINI_EMBEDDING_MODEL` | Embedding model to use | `text-embedding-004` |
| `EMBEDDING_DIMENSIONS` | Output dimensions (768, 256, or 3072) | `768` |

## Optional Variables

### Server Configuration
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `HOST` | Server host | `0.0.0.0` |

### Worker Configuration
| Variable | Description | Default |
|----------|-------------|---------|
| `WORKER_POLL_INTERVAL` | Queue worker poll interval (ms) | `5000` |
| `WORKER_MAX_RETRIES` | Max retry attempts for failed jobs | `5` |

### JWT (if using authentication)
| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Secret for signing JWT tokens | Required for auth |

## Example .env file

```bash
# Server
PORT=3000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key-here

# Google Gemini (required for embedding pipeline)
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_EMBEDDING_MODEL=text-embedding-004
EMBEDDING_DIMENSIONS=768

# Worker
WORKER_POLL_INTERVAL=5000
WORKER_MAX_RETRIES=5

# JWT (optional)
JWT_SECRET=your-secret-here
```

## Getting Started

1. Copy this to `.env` file in the fastify-api directory
2. Replace placeholder values with actual credentials
3. Get your Gemini API key from https://aistudio.google.com/app/apikey
4. Ensure `GEMINI_API_KEY` is set for the embedding pipeline to work
5. Run `npm install` to install dependencies including `@google/generative-ai`

## Embedding Dimensions

Gemini supports flexible output dimensions:
- **768** (default) - Best balance of accuracy and storage
- **256** - Smallest storage, good for high-volume scenarios
- **3072** - Maximum accuracy, largest storage

Lower dimensions = less storage cost in Supabase + faster similarity search.

## Migration from OpenAI

If you previously used OpenAI embeddings:
1. All existing embeddings have been cleared (status reset to 'pending')
2. The system will automatically regenerate embeddings using Gemini
3. Update your `.env` file to use `GEMINI_API_KEY` instead of `OPENAI_API_KEY`

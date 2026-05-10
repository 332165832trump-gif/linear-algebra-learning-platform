# Deployment

## GitHub

Repository:

https://github.com/332165832trump-gif/linear-algebra-learning-platform

The `main` branch contains the production source. CI runs tests and build on every push.

## Vercel Import

1. Open Vercel dashboard.
2. Choose **Add New Project**.
3. Import `332165832trump-gif/linear-algebra-learning-platform`.
4. Use these settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm ci`
5. Add environment variables when AI tutor should call OpenAI:
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL` set to `gpt-4.1` unless you intentionally choose another model
6. Deploy.

The app also works without `OPENAI_API_KEY`; `/api/tutor` returns a local fallback explanation.

## Production Checks

After deployment:

- Open the Vercel URL.
- Confirm the home page title is `高等代数交互式学习平台`.
- Confirm a WebGL canvas appears in the interactive lab.
- Open the AI tutor panel and ask a short question.
- Confirm `/api/tutor` returns a structured answer or fallback response.

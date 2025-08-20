Personal Task Assistant with chat UI and server-side agent.

## Quickstart

1. Create `.env.local` with your OpenAI key:

```
OPENAI_API_KEY=sk-...
```

2. Run the dev server:

```
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000). Ask things like:
- "Add buy milk"
- "List tasks"
- "Complete task <id>"

Data is stored locally in `data/tasks.json`.

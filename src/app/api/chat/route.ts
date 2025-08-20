import OpenAI from "openai";
// Use the standard Request type for route handlers
import { z } from "zod";
import { completeTask, createTask, listTasks } from "@/lib/tasks";

// Defer client creation until request time to avoid build-time failures when env is missing

const MessageSchema = z.object({ role: z.enum(["user", "assistant", "system"]), content: z.string() });
const ChatBody = z.object({ messages: z.array(MessageSchema) });

function buildSystemPrompt() {
  return `You are a helpful personal task assistant. You can create, list, and complete tasks for the user by deciding on a tool to call. Use the following tool call JSON formats when needed and wait for results before responding:

TOOLS:
- create_task: { "tool": "create_task", "title": string }
- list_tasks: { "tool": "list_tasks" }
- complete_task: { "tool": "complete_task", "id": string }

If you are not calling a tool, just reply normally.`;
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => ({}));
  const parsed = ChatBody.safeParse(json);
  if (!parsed.success) return new Response("Invalid body", { status: 400 });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return Response.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });

  const userMessages = parsed.data.messages;
  const messages = [{ role: "system", content: buildSystemPrompt() } as const, ...userMessages];

  // Ask the model for either a normal reply or a tool call JSON
  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0.2,
  });

  const text = completion.choices[0]?.message?.content ?? "";

  // Try to parse as tool call JSON
  try {
    type ToolCall = { tool?: "create_task" | "list_tasks" | "complete_task"; title?: string; id?: string };
    const maybe = JSON.parse(text) as ToolCall;
    if (maybe && typeof maybe === "object" && typeof maybe.tool === "string") {
      if (maybe.tool === "create_task" && typeof maybe.title === "string") {
        const t = await createTask(maybe.title);
        return Response.json({ role: "assistant", content: `Created task: ${t.title} (id: ${t.id})`, data: { task: t } });
      }
      if (maybe.tool === "list_tasks") {
        const tasks = await listTasks();
        return Response.json({ role: "assistant", content: tasks.length ? tasks.map(t => `- [${t.completed ? "x" : " "}] ${t.title} (${t.id})`).join("\n") : "No tasks yet.", data: { tasks } });
      }
      if (maybe.tool === "complete_task" && typeof maybe.id === "string") {
        const t = await completeTask(maybe.id);
        if (!t) return new Response("Not found", { status: 404 });
        return Response.json({ role: "assistant", content: `Completed task: ${t.title}` , data: { task: t } });
      }
    }
  } catch {
    // not a tool call, fall through
  }

  // Default: return the model's text as assistant message
  return Response.json({ role: "assistant", content: text || "I couldn't understand that." });
}



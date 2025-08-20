import { nanoid } from "nanoid";
import { z } from "zod";
import { readJsonFile, writeJsonFile } from "./fileStore";

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  completed: z.boolean().default(false),
  createdAt: z.string(),
  completedAt: z.string().nullable().default(null),
});

export type Task = z.infer<typeof TaskSchema>;

export async function listTasks(): Promise<Task[]> {
  const tasks = await readJsonFile<Task[]>();
  return tasks.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function createTask(title: string): Promise<Task> {
  const tasks = await readJsonFile<Task[]>();
  const task: Task = {
    id: nanoid(),
    title,
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  tasks.push(task);
  await writeJsonFile(tasks);
  return task;
}

export async function completeTask(id: string): Promise<Task | null> {
  const tasks = await readJsonFile<Task[]>();
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return null;
  const existing = tasks[index];
  const updated: Task = { ...existing, completed: true, completedAt: new Date().toISOString() };
  tasks[index] = updated;
  await writeJsonFile(tasks);
  return updated;
}



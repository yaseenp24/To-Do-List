import { promises as fs } from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const tasksFilePath = path.join(dataDir, "tasks.json");

export async function ensureDataFileExists(): Promise<void> {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.access(tasksFilePath);
  } catch {
    await fs.writeFile(tasksFilePath, JSON.stringify([]), "utf8");
  }
}

export async function readJsonFile<T>(): Promise<T> {
  await ensureDataFileExists();
  const raw = await fs.readFile(tasksFilePath, "utf8");
  return JSON.parse(raw) as T;
}

export async function writeJsonFile<T>(data: T): Promise<void> {
  await ensureDataFileExists();
  const serialized = JSON.stringify(data, null, 2);
  await fs.writeFile(tasksFilePath, serialized, "utf8");
}

export { tasksFilePath };



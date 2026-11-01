import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

/** Keep a CI-downloadable copy even if remote storage or Slack delivery fails. */
export async function writeStoryArtifact(fileName: string, screenshot: Buffer): Promise<void> {
  const path = join("artifacts", "instagram", fileName);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, screenshot);
}

import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

/**
 * Storage abstraction for uploaded files (résumés / cover letters). The
 * local-disk implementation below is swappable for an S3-compatible backend
 * later without touching call sites — every caller only depends on this
 * interface, never on `fs` directly.
 */
export interface FileStorage {
  put(buffer: Buffer, originalName: string): Promise<string>;
  get(storagePath: string): Promise<Buffer>;
  delete(storagePath: string): Promise<void>;
}

class LocalDiskStorage implements FileStorage {
  private readonly rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
  }

  private resolve(storagePath: string): string {
    const resolved = path.resolve(this.rootDir, storagePath);
    if (!resolved.startsWith(path.resolve(this.rootDir))) {
      throw new Error("Invalid storage path");
    }
    return resolved;
  }

  async put(buffer: Buffer, originalName: string): Promise<string> {
    await fs.mkdir(this.rootDir, { recursive: true });
    const ext = path.extname(originalName);
    const storagePath = `${randomUUID()}${ext}`;
    await fs.writeFile(this.resolve(storagePath), buffer);
    return storagePath;
  }

  async get(storagePath: string): Promise<Buffer> {
    return fs.readFile(this.resolve(storagePath));
  }

  async delete(storagePath: string): Promise<void> {
    await fs.rm(this.resolve(storagePath), { force: true });
  }
}

export const storage: FileStorage = new LocalDiskStorage(process.env.UPLOAD_DIR ?? "./uploads");

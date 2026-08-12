import { Router } from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.resolve(__dirname, "../../uploads");

export const uploadsRouter = Router();

uploadsRouter.get("/*", (req, res) => {
  const rel = req.path.replace(/^\//, "");
  const filePath = path.normalize(path.join(uploadsRoot, rel));
  if (!filePath.startsWith(uploadsRoot)) {
    res.status(400).json({ error: "Invalid path" });
    return;
  }
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.sendFile(filePath);
});

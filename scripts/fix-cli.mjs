// Post-build script to add shebang and make CLI executable
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.join(__dirname, "../dist/cli.cjs");

if (fs.existsSync(cliPath)) {
  const content = fs.readFileSync(cliPath, "utf8");
  const contentWithShebang = `#!/usr/bin/env node\n${content}`;
  fs.writeFileSync(cliPath, contentWithShebang);
  
  // Make executable on Unix systems
  try {
    fs.chmodSync(cliPath, 0o755);
    console.log("✅ CLI made executable with shebang");
  } catch (error) {
    console.log("⚠️  Could not make CLI executable (this is normal on Windows)");
  }
} else {
  console.error("❌ CLI file not found at:", cliPath);
  process.exit(1);
}
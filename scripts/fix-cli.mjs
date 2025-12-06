#!/usr/bin/env node
/**
 * Post-build script to add shebang to CLI file
 * The tsup bundler doesn't add shebangs automatically for CJS output
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliPath = resolve(__dirname, "../dist/cli.cjs");

const content = readFileSync(cliPath, "utf-8");

// Only add shebang if not already present
if (!content.startsWith("#!/")) {
  const shebang = "#!/usr/bin/env node\n";
  writeFileSync(cliPath, shebang + content);
  console.log("Added shebang to dist/cli.cjs");
} else {
  console.log("Shebang already present in dist/cli.cjs");
}

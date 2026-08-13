import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";

import { createMeetingDashboardPackageParts } from "../src/features/export/meetingDashboardPackage";
import { createDefaultStandaloneDashboardSpec } from "../src/features/runtime/standaloneDashboard";

function requiredOption(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value) {
    throw new Error(`Missing required option ${name}.`);
  }
  return value;
}

async function publishPackageFiles(
  outputDirectory: string,
  files: ReadonlyArray<readonly [string, string]>,
): Promise<void> {
  const parentDirectory = dirname(outputDirectory);
  await mkdir(parentDirectory, { recursive: true });
  const stagingDirectory = await mkdtemp(
    join(parentDirectory, `.${basename(outputDirectory)}-`),
  );
  let published = false;
  try {
    await Promise.all(
      files.map(([fileName, content]) =>
        writeFile(join(stagingDirectory, fileName), content, "utf8"),
      ),
    );

    try {
      const existing = await lstat(outputDirectory);
      if (existing.isSymbolicLink() || !existing.isDirectory()) {
        throw new Error(
          `Package output path must be a directory: ${outputDirectory}`,
        );
      }
      if ((await readdir(outputDirectory)).length > 0) {
        throw new Error(
          `Package output directory must be absent or empty: ${outputDirectory}`,
        );
      }
      await rm(outputDirectory, { recursive: false, force: false });
    } catch (error: unknown) {
      if (
        !(
          error instanceof Error &&
          "code" in error &&
          (error as NodeJS.ErrnoException).code === "ENOENT"
        )
      ) {
        throw error;
      }
    }

    await rename(stagingDirectory, outputDirectory);
    published = true;
  } finally {
    if (!published) {
      await rm(stagingDirectory, { recursive: true, force: true });
    }
  }
}

async function materializeMeetingDashboardPackage() {
  const smokePath = resolve(requiredOption("--smoke-result"));
  const dashboardPath = resolve(requiredOption("--dashboard-html"));
  const outputDirectory = resolve(requiredOption("--output"));
  const runReference = requiredOption("--run-reference");
  const generatedAt = requiredOption("--generated-at");
  const browserSmokeResult = JSON.parse(
    await readFile(smokePath, "utf8"),
  ) as unknown;
  const dashboardDocument = await readFile(dashboardPath, "utf8");
  const resolution = createMeetingDashboardPackageParts({
    spec: createDefaultStandaloneDashboardSpec(),
    dashboardDocument,
    browserSmokeResult,
    runReference,
    generatedAt,
  });

  if (!resolution.ok) {
    throw new Error(resolution.errors.join("; "));
  }

  await publishPackageFiles(outputDirectory, Object.entries(resolution.files));
  process.stdout.write(
    `Materialized ${Object.keys(resolution.files).length} meeting dashboard package parts in ${outputDirectory}.\n`,
  );
}

void materializeMeetingDashboardPackage().catch((error: unknown) => {
  const message =
    error instanceof Error
      ? error.message
      : "Meeting dashboard package materialization failed.";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});

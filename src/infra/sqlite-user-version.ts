type SqliteUserVersionReader = {
  prepare: (sql: string) => { get: () => unknown };
};

export function readSqliteUserVersion(db: SqliteUserVersionReader): number {
  const row = db.prepare("PRAGMA user_version").get() as { user_version?: unknown } | undefined;
  return Number(row?.user_version ?? 0);
}

export function createNewerSqliteSchemaVersionError(
  databaseLabel: string,
  pathname: string,
  schemaVersion: number,
  supportedVersion: number,
): Error {
  const error = new Error(
    `${databaseLabel} ${pathname} uses newer schema version ${schemaVersion}; this GrokBot build supports ${supportedVersion}. Upgrade GrokBot before opening this database. Do not downgrade GrokBot or modify the database. To run this older build, use a separate state directory or restore a compatible backup. See https://docs.grokbot.ai/reference/database-schemas.`,
  );
  error.name = "SqliteSchemaVersionError";
  return error;
}

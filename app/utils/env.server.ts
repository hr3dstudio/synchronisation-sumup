export function isEnvFlagEnabled(value: string | undefined, defaultValue = false) {
  if (value == null || value.trim() === "") {
    return defaultValue;
  }

  return ["1", "true", "yes", "y", "on"].includes(
    value.trim().replace(/^["']|["']$/g, "").toLowerCase(),
  );
}

export function isDryRunEnabled() {
  return isEnvFlagEnabled(process.env.DRY_RUN, true);
}

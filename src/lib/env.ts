// Read env vars dynamically at runtime.
//
// Next.js statically analyses `process.env.FOO` and replaces it with the
// literal value at *build* time.  That means changing .env.local after the
// build has no effect — the old value is baked into the JavaScript bundle.
//
// Using bracket notation (`process.env[key]`) prevents the bundler from
// performing that substitution, so the value is always read from the real
// environment at runtime.

export function env(key: string): string | undefined {
  return process.env[key];
}

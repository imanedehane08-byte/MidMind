// Unit tests for the AI service helper that detects quota-related errors.
import assert from "node:assert/strict";
import test from "node:test";

process.env.OPENAI_API_KEY ||= "test-key";

const { isQuotaError } = await import("./ai.js");

// Confirms that a 429 response with a known quota error code is recognised.
test("isQuotaError detects provider quota errors", () => {
  assert.equal(
    isQuotaError({ status: 429, code: "insufficient_quota" }),
    true
  );

  assert.equal(
    isQuotaError({ status: 429, error: { code: "insufficient_quota_error" } }),
    true
  );
});

// Confirms that server errors and rate-limit errors are not treated as quota errors.
test("isQuotaError ignores non-quota errors", () => {
  assert.equal(isQuotaError({ status: 500, code: "server_error" }), false);
  assert.equal(isQuotaError({ status: 429, code: "rate_limit_exceeded" }), false);
});

const test = require("node:test");
const assert = require("node:assert/strict");
const { isValidGithubUrl, GITHUB_URL_ERROR_MESSAGE } = require("../../shared/submissionValidation");

test("isValidGithubUrl accepts valid GitHub repository URLs", () => {
  assert.equal(isValidGithubUrl("https://github.com/username/repository"), true);
  assert.equal(isValidGithubUrl("https://github.com/username/repository/tree/main"), true);
  assert.equal(isValidGithubUrl("https://www.github.com/username/repository"), true);
  assert.equal(isValidGithubUrl("http://github.com/username/repository"), true);
  assert.equal(isValidGithubUrl("https://github.com/torvalds/linux/blob/master/README"), true);
  assert.equal(isValidGithubUrl("   https://github.com/username/repo   "), true);
});

test("isValidGithubUrl rejects missing, empty, or non-string inputs", () => {
  assert.equal(isValidGithubUrl(""), false);
  assert.equal(isValidGithubUrl("   "), false);
  assert.equal(isValidGithubUrl(null), false);
  assert.equal(isValidGithubUrl(undefined), false);
  assert.equal(isValidGithubUrl(12345), false);
  assert.equal(isValidGithubUrl({}), false);
});

test("isValidGithubUrl rejects non-GitHub domains and deceptive hostnames", () => {
  assert.equal(isValidGithubUrl("https://github.com.example.com/repository"), false);
  assert.equal(isValidGithubUrl("https://example.com/github.com"), false);
  assert.equal(isValidGithubUrl("https://gitlab.com/username/repository"), false);
  assert.equal(isValidGithubUrl("https://bitbucket.org/username/repository"), false);
  assert.equal(isValidGithubUrl("https://notgithub.com/username/repository"), false);
  assert.equal(isValidGithubUrl("https://fake-github.com/username/repository"), false);
});

test("isValidGithubUrl rejects invalid protocols and malformed URLs", () => {
  assert.equal(isValidGithubUrl("ftp://github.com/username/repository"), false);
  assert.equal(isValidGithubUrl("javascript:alert(1)"), false);
  assert.equal(isValidGithubUrl("github.com/username/repository"), false); // missing protocol
  assert.equal(isValidGithubUrl("htp://github.com/username/repository"), false);
  assert.equal(isValidGithubUrl("https:///github.com"), false);
  assert.equal(isValidGithubUrl("not a url at all"), false);
});

test("isValidGithubUrl rejects URLs without a repository path", () => {
  assert.equal(isValidGithubUrl("https://github.com"), false);
  assert.equal(isValidGithubUrl("https://github.com/"), false);
  assert.equal(isValidGithubUrl("https://github.com/username"), false);
  assert.equal(isValidGithubUrl("https://www.github.com"), false);
  assert.equal(isValidGithubUrl("https://www.github.com/"), false);
});

test("GITHUB_URL_ERROR_MESSAGE matches exact required text", () => {
  assert.equal(
    GITHUB_URL_ERROR_MESSAGE,
    "Invalid GitHub link. Please provide a valid GitHub repository URL."
  );
});

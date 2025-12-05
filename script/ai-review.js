const fs = require('fs');
const OpenAI = require('openai');

// Helper gọi GitHub API
async function callGitHub(path, options = {}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN is not set');
  }

  const baseUrl = process.env.GITHUB_API_URL || 'https://api.github.com';

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${path} failed: ${res.status} ${text}`);
  }

  // Nếu không cần body (ví dụ 204) thì không parse JSON
  if (res.status === 204) return null;
  return res.json();
}

async function main() {
  const repoFull = process.env.GITHUB_REPOSITORY; // owner/repo :contentReference[oaicite:5]{index=5}
  const eventPath = process.env.GITHUB_EVENT_PATH; // file chứa payload :contentReference[oaicite:6]{index=6}
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!repoFull) throw new Error('GITHUB_REPOSITORY is not set');
  if (!eventPath) throw new Error('GITHUB_EVENT_PATH is not set');
  if (!openaiKey) throw new Error('OPENAI_API_KEY is not set');

  const [owner, repo] = repoFull.split('/');

  const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));

  const pullNumber = event.pull_request?.number;
  if (!pullNumber) {
    console.log('Not a pull_request event, skipping.');
    return;
  }

  console.log(`Running AI review for PR #${pullNumber} in ${owner}/${repo}`);

  // 1) Lấy danh sách file + patch trong PR
  const files = await callGitHub(
    `/repos/${owner}/${repo}/pulls/${pullNumber}/files?per_page=100`,
  );

  if (!files || files.length === 0) {
    console.log('No files in this PR, nothing to review.');
    return;
  }

  // 2) Build combined diffs
  let combinedDiffs = '';

  for (const file of files) {
    combinedDiffs += `### File: ${file.filename}\n\n`;

    if (file.patch) {
      // tránh conflict với ``` trong markdown
      const sanitizedPatch = file.patch.replace(/```/g, "'''");

      combinedDiffs += '```diff\n';
      combinedDiffs += sanitizedPatch;
      combinedDiffs += '\n```\n\n';
    } else {
      combinedDiffs += 'No patch available (probably a binary file)\n\n';
    }

    combinedDiffs += '---\n\n';
  }

  // 3) Prompt cho LLM
  const prompt = `
You are a senior Python developer.
Please review the following code changes in these files:

${combinedDiffs}

---
Your mission:
- Focus only on the changes in the diff.
- Point out potential bugs, security problems, or bad practices.
- Suggest improvements (naming, readability, performance) when it is useful.
- Keep the response concise and structured in markdown (headings + bullet points).
  `.trim();

  // 4) Gọi OpenAI Chat Completions :contentReference[oaicite:7]{index=7}
  const client = new OpenAI({ apiKey: openaiKey });

  console.log('Calling OpenAI...');
  const completion = await client.chat.completions.create({
    model: 'gpt-5.1',
    temperature: 0.2,
    messages: [
      {
        role: 'developer',
        content:
          'You are a strict, detail-oriented code reviewer. Reply in English in GitHub-flavored markdown.',
      },
      { role: 'user', content: prompt },
    ],
  });

  const reviewText = completion.choices[0]?.message?.content?.trim();
  if (!reviewText) {
    console.log('No review text returned by model, skipping create review.');
    return;
  }

  // 5) Tạo review cho PR với event COMMENT :contentReference[oaicite:8]{index=8}
  const body = `AI code review (experimental)\n\n${reviewText}`;

  console.log('Creating GitHub review...');
  await callGitHub(`/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'COMMENT',
      body,
    }),
  });

  console.log('AI review posted successfully.');
}

main().catch((err) => {
  console.error('AI review failed:', err);
  process.exit(1);
});

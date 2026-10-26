import fetch from 'node-fetch';

const backend = 'http://127.0.0.1:3000';

async function run() {
  const registerRes = await fetch(`${backend}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: `copilot_test_${Date.now()}`,
      email: `copilot_test_${Date.now()}@example.com`,
      password: 'Password123!'
    }),
  });
  console.log('register status', registerRes.status);
  console.log('register body', await registerRes.text());

  const loginRes = await fetch(`${backend}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'copilot_test_user@example.com', password: 'Password123!' }),
  });
  console.log('login status', loginRes.status);
  const loginBody = await loginRes.text();
  console.log('login body', loginBody);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
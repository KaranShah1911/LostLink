/**
 * Creates a random id in UUID format (e.g. "3f6c1d2e-8a4b-4c1f-9e2d-7b5a0c3d9f18").
 *
 * Used as an idempotency key: the report and claim forms create ONE id when they open and send
 * it with every submit attempt, so the server can recognise a retry of a request it already
 * handled and avoid creating a duplicate. 122 random bits make two equal ids practically impossible
 * (and the server only compares ids of the same user).
 */
export function newRequestId(): string {
  const hex = '0123456789abcdef';
  let id = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) id += '-';
    else if (i === 14) id += '4'; // UUID version 4
    else if (i === 19) id += hex[8 + Math.floor(Math.random() * 4)]; // UUID variant bits
    else id += hex[Math.floor(Math.random() * 16)];
  }
  return id;
}

// Auth is cookie-session based: the browser sends the `formate.sid` session
// cookie automatically with `credentials: "include"`. No bearer token needed.
export async function authedFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(input, { ...init, credentials: "include" });
}

interface UserAccount {
  username: string;
  password: string;
  createdAt: string;
}

const USERS_KEY = "ordertrail-users-v1";
const SESSION_KEY = "ordertrail-session-v1";

function readUsers() {
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    if (!raw) return [] as UserAccount[];
    const parsed = JSON.parse(raw) as UserAccount[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [] as UserAccount[];
  }
}

function writeUsers(users: UserAccount[]) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function signUp(username: string, password: string) {
  const trimmedUser = username.trim();
  if (!trimmedUser || !password) {
    return { ok: false as const, error: "Username and password are required." };
  }
  const users = readUsers();
  if (users.some((user) => user.username.toLowerCase() === trimmedUser.toLowerCase())) {
    return { ok: false as const, error: "Username already exists." };
  }
  users.push({
    username: trimmedUser,
    password,
    createdAt: new Date().toISOString(),
  });
  writeUsers(users);
  window.localStorage.setItem(SESSION_KEY, trimmedUser);
  return { ok: true as const };
}

export function login(username: string, password: string) {
  const trimmedUser = username.trim();
  const users = readUsers();
  const found = users.find(
    (user) => user.username.toLowerCase() === trimmedUser.toLowerCase() && user.password === password,
  );
  if (!found) {
    return { ok: false as const, error: "Invalid username or password." };
  }
  window.localStorage.setItem(SESSION_KEY, found.username);
  return { ok: true as const };
}

export function logout() {
  window.localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser() {
  return window.localStorage.getItem(SESSION_KEY);
}

export function isAuthenticated() {
  return Boolean(getCurrentUser());
}


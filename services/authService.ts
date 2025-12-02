// services/authServices.ts
import { User } from '../types';

// Keys for LocalStorage acting as our "Database" tables
const DB_USERS_KEY = 'hireprep_db_users';
const SESSION_KEY = 'hireprep_current_session';

// Simulate a network delay for realism (Backend Latency)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class AuthService {
  // --- Private Helpers (Simulating Database Access) ---
  
  // SELECT * FROM users
  private getUsers(): User[] {
    const usersJson = localStorage.getItem(DB_USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  }

  // INSERT / UPDATE users
  private saveUsers(users: User[]) {
    localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
  }

  // --- Public API (Simulating Backend Endpoints) ---

  /**
   * Register a new user
   * Simulates: POST /api/register
   */
  async register(name: string, email: string, password: string) {
    const res = await fetch("http://localhost:4000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) throw new Error((await res.json()).error);

    return res.json();
  }


  /**
   * Login an existing user
   * Simulates: POST /api/login
   */
  async login(email: string, password: string) {
    const res = await fetch("http://localhost:4000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) throw new Error((await res.json()).error);

    return res.json();
  }


  /**
   * Logout
   * Simulates: POST /api/logout
   */
  logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  /**
   * Check Session on App Load
   * Simulates: GET /api/me (Session Validation)
   */
  getCurrentUser(): User | null {
    const sessionJson = localStorage.getItem(SESSION_KEY);
    return sessionJson ? JSON.parse(sessionJson) : null;
  }

  // Helper to handle session storage
  private setSession(user: User) {
    // We strip the password before putting it in the session state for security best practices
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = user;
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
  }
}

export const authService = new AuthService();

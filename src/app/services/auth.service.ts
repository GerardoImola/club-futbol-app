import { Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';

const SESSION_KEY = 'cac_admin_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  isAdmin = signal<boolean>(this.checkSession());

  login(username: string, password: string): boolean {
    const u = username.trim();
    const p = password;
    if (u === environment.adminUsername && p === environment.adminPassword) {
      sessionStorage.setItem(SESSION_KEY, '1');
      this.isAdmin.set(true);
      return true;
    }
    return false;
  }

  logout(): void {
    sessionStorage.removeItem(SESSION_KEY);
    this.isAdmin.set(false);
  }

  private checkSession(): boolean {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  }
}

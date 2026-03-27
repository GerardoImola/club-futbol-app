import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="login-page">
      <div class="login-card">
        <img src="images/escudo-cac.png" alt="CAC" class="login-escudo">
        <h1>Admin</h1>
        <p class="subtitle">Usuario y contraseña para editar contenido</p>
        @if (error) {
          <p class="error">{{ error }}</p>
        }
        <form (ngSubmit)="onSubmit()">
          <input
            type="text"
            [(ngModel)]="username"
            name="username"
            placeholder="Usuario"
            autocomplete="username"
            class="input"
          />
          <input
            type="password"
            [(ngModel)]="password"
            name="password"
            placeholder="Contraseña"
            autocomplete="current-password"
            class="input"
          />
          <button type="submit" class="btn">Ingresar</button>
        </form>
        <a routerLink="/resultados" class="volver">← Volver a resultados</a>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 60vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
    }
    .login-card {
      background: white;
      padding: 2rem;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      width: 100%;
      max-width: 320px;
      text-align: center;
    }
    .login-escudo {
      width: 64px;
      height: 64px;
      object-fit: contain;
      margin-bottom: 1rem;
    }
    .login-card h1 {
      margin: 0 0 0.25rem;
      color: #1a472a;
      font-size: 1.5rem;
    }
    .subtitle {
      color: #666;
      font-size: 0.9rem;
      margin: 0 0 1.5rem;
    }
    .error {
      color: #c0392b;
      font-size: 0.9rem;
      margin: 0 0 1rem;
    }
    .input {
      width: 100%;
      padding: 0.875rem 1rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 1rem;
      margin-bottom: 1rem;
    }
    .input:focus {
      outline: none;
      border-color: #1a472a;
    }
    .btn {
      width: 100%;
      padding: 1rem;
      background: #1a472a;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
    }
    .volver {
      display: block;
      margin-top: 1.5rem;
      color: #1a472a;
      text-decoration: none;
      font-size: 0.9rem;
    }
  `]
})
export class AdminLoginComponent {
  username = '';
  password = '';
  error = '';

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    this.error = '';
    if (this.auth.login(this.username, this.password)) {
      this.router.navigate(['/resultados']);
    } else {
      this.error = 'Usuario o contraseña incorrectos';
    }
  }
}

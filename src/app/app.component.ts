import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { SocioAuthService } from './services/socio-auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  clubName = 'Club Atlético Canalense';
  clubShort = 'CAC';
  menuOpen = false;

  constructor(
    public auth: AuthService,
    public socioAuth: SocioAuthService,
    private router: Router
  ) {
    void this.socioAuth.init();
  }

  async salir(): Promise<void> {
    this.auth.logout();
    await this.socioAuth.logout();
    this.closeMenu();
    await this.router.navigateByUrl('/socios/login');
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }
}

import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { SocioAuthService } from './services/socio-auth.service';
import { ThemeService } from './services/theme.service';

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

  /** En login de socio no hay menú lateral ni hamburguesa */
  readonly menuShellVisible = signal(true);

  constructor(
    public auth: AuthService,
    public socioAuth: SocioAuthService,
    public theme: ThemeService,
    private router: Router
  ) {
    void this.socioAuth.init();
    this.syncMenuShellVisibility();
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe(() => {
      this.syncMenuShellVisibility();
    });
  }

  private syncMenuShellVisibility(): void {
    const path = this.router.url.split('?')[0].split('#')[0];
    const enLoginSocio = path === '/socios/login';
    this.menuShellVisible.set(!enLoginSocio);
    if (enLoginSocio) {
      this.menuOpen = false;
    }
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

import { Component, NgZone, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SocioAuthService } from '../../services/socio-auth.service';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';
import { socioSafeReturnUrl } from '../../utils/socio-return-url';

@Component({
  selector: 'app-socio-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './socio-login.component.html',
  styleUrl: './socio-login.component.css'
})
export class SocioLoginComponent implements OnInit {
  modo: 'login' | 'registro' | 'recuperar' = 'login';
  email = '';
  password = '';
  nombre = '';
  telefono = '';
  nuevaPassword = '';
  nuevaPassword2 = '';
  error = '';
  mensajeExito = '';
  loading = false;

  mostrarPassword = false;
  mostrarNuevaPassword = false;
  mostrarNuevaPassword2 = false;

  constructor(
    private socioAuth: SocioAuthService,
    private supabase: SupabaseService,
    private clubAuth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    void this.bootstrap();
  }

  private async bootstrap(): Promise<void> {
    await this.socioAuth.init();

    if (this.clubAuth.isAdmin()) {
      const raw = this.route.snapshot.queryParams['returnUrl'];
      const url = socioSafeReturnUrl(raw) ?? '/inicio';
      await this.router.navigateByUrl(url);
      return;
    }

    const hash = typeof globalThis !== 'undefined' ? globalThis.location?.hash ?? '' : '';
    if (hash.includes('type=recovery') || hash.includes('recovery')) {
      this.aplicarModoDesdeQuery();
      return;
    }
    if (this.enRecuperacionDesdeEmail) {
      this.aplicarModoDesdeQuery();
      return;
    }

    const client = this.supabase.client;
    if (client && this.isConfigured) {
      const {
        data: { session }
      } = await client.auth.getSession();
      if (session) {
        const raw = this.route.snapshot.queryParams['returnUrl'];
        const url = socioSafeReturnUrl(raw) ?? '/inicio';
        await this.router.navigateByUrl(url);
        return;
      }
    }

    this.aplicarModoDesdeQuery();
  }

  private aplicarModoDesdeQuery(): void {
    if (this.route.snapshot.queryParamMap.get('modo') === 'registro') {
      this.modo = 'registro';
    }
  }

  get isConfigured(): boolean {
    return this.supabase.isConfigured;
  }

  get enRecuperacionDesdeEmail(): boolean {
    return this.socioAuth.enRecuperacionPassword();
  }

  toggleModo() {
    this.modo = this.modo === 'login' ? 'registro' : 'login';
    this.error = '';
    this.mensajeExito = '';
  }

  irARecuperar() {
    this.modo = 'recuperar';
    this.error = '';
    this.mensajeExito = '';
  }

  volverAlLogin() {
    this.modo = 'login';
    this.error = '';
    this.mensajeExito = '';
  }

  async enviarRecuperacion() {
    this.error = '';
    this.mensajeExito = '';
    if (!this.email.trim()) {
      this.error = 'Ingresá tu email';
      return;
    }
    this.loading = true;
    const result = await this.socioAuth.resetPasswordForEmail(this.email);
    this.ngZone.run(() => {
      this.loading = false;
      if (result.error) {
        this.error = result.error;
        return;
      }
      this.mensajeExito =
        'Si el email está registrado, recibís un enlace para elegir una contraseña nueva. Revisá también spam.';
      this.modo = 'login';
    });
  }

  async guardarNuevaPasswordRecuperacion() {
    this.error = '';
    this.mensajeExito = '';
    if (this.nuevaPassword.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }
    if (this.nuevaPassword !== this.nuevaPassword2) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }
    this.loading = true;
    const result = await this.socioAuth.actualizarPasswordRecuperacion(this.nuevaPassword);
    this.ngZone.run(() => {
      this.loading = false;
      if (result.error) {
        this.error = result.error;
        return;
      }
      const raw = this.route.snapshot.queryParams['returnUrl'];
      void this.router.navigateByUrl(socioSafeReturnUrl(raw) ?? '/inicio');
    });
  }

  async onSubmit() {
    this.ngZone.run(() => {
      this.error = '';
      this.loading = true;
    });

    try {
      if (this.modo === 'login') {
        if (this.clubAuth.login(this.email.trim(), this.password)) {
          const returnUrl = socioSafeReturnUrl(this.route.snapshot.queryParams['returnUrl']) ?? '/inicio';
          this.ngZone.run(() => {
            this.loading = false;
          });
          await this.router.navigateByUrl(returnUrl);
          return;
        }
        const result = await this.socioAuth.login(this.email, this.password);
        if (result.error) {
          this.ngZone.run(() => {
            this.error = result.error!;
            this.loading = false;
          });
          return;
        }
      } else {
        if (!this.nombre.trim()) {
          this.ngZone.run(() => {
            this.error = 'El nombre es obligatorio';
            this.loading = false;
          });
          return;
        }
        const result = await this.socioAuth.registro(
          this.email,
          this.password,
          this.nombre.trim(),
          this.telefono.trim() || undefined
        );
        if (result.error) {
          this.ngZone.run(() => {
            this.error = result.error!;
            this.loading = false;
          });
          return;
        }
        if (result.pendienteEmail) {
          this.ngZone.run(() => {
            this.loading = false;
            this.error = '';
            this.mensajeExito = result.mensaje || 'Revisá tu correo para confirmar la cuenta.';
            this.modo = 'login';
          });
          return;
        }
      }

      const returnUrl = socioSafeReturnUrl(this.route.snapshot.queryParams['returnUrl']) ?? '/inicio';
      this.ngZone.run(() => {
        this.loading = false;
      });
      await this.router.navigateByUrl(returnUrl);
    } catch (e) {
      this.ngZone.run(() => {
        this.error = e instanceof Error ? e.message : 'Error inesperado';
        this.loading = false;
      });
    }
  }
}

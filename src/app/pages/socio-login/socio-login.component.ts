import { Component, NgZone, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SocioAuthService } from '../../services/socio-auth.service';
import { SupabaseService } from '../../services/supabase.service';

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
    private router: Router,
    private route: ActivatedRoute,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    void this.socioAuth.init();
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
      void this.router.navigateByUrl(this.route.snapshot.queryParams['returnUrl'] || '/mi-cuenta');
    });
  }

  async onSubmit() {
    this.ngZone.run(() => {
      this.error = '';
      this.loading = true;
    });

    try {
      if (this.modo === 'login') {
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

      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/mi-cuenta';
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

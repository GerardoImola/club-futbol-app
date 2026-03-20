import { Component, NgZone } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterLink } from '@angular/router';
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
export class SocioLoginComponent {
  modo: 'login' | 'registro' = 'login';
  email = '';
  password = '';
  nombre = '';
  telefono = '';
  error = '';
  mensajeExito = '';
  loading = false;

  constructor(
    private socioAuth: SocioAuthService,
    private supabase: SupabaseService,
    private router: Router,
    private route: ActivatedRoute,
    private ngZone: NgZone
  ) {}

  get isConfigured(): boolean {
    return this.supabase.isConfigured;
  }

  toggleModo() {
    this.modo = this.modo === 'login' ? 'registro' : 'login';
    this.error = '';
    this.mensajeExito = '';
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

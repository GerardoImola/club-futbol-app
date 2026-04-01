import { Pipe, PipeTransform } from '@angular/core';

/** Primera letra de cada palabra en mayúscula (resto en minúscula), locale es. */
export function formatearNombreTitulo(value: string | null | undefined): string {
  if (value == null || !String(value).trim()) {
    return (value ?? '').toString();
  }
  return String(value)
    .trim()
    .split(/\s+/)
    .map((w) => {
      if (!w) return w;
      return w.charAt(0).toLocaleUpperCase('es') + w.slice(1).toLocaleLowerCase('es');
    })
    .join(' ');
}

@Pipe({
  name: 'nombreTitulo',
  standalone: true
})
export class NombreTituloPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return formatearNombreTitulo(value);
  }
}

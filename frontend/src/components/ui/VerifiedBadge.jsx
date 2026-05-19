import React from 'react';
import { BadgeCheck } from 'lucide-react';

/**
 * Icono de verificacion para organizaciones.
 * Se muestra al lado del nombre con los colores de marca (violeta).
 * @param {string} className - Clases CSS adicionales opcionales.
 */
export default function VerifiedBadge({ className = '' }) {
    return (
        <BadgeCheck
            className={`inline-block h-5 w-5 text-brand-500 flex-shrink-0 ${className}`}
            aria-label="Organizacion verificada"
        />
    );
}

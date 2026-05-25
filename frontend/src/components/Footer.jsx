import React, { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail } from 'lucide-react';

/**
 * Componente que representa el pie de página de la aplicación.
 * Proporciona enlaces de navegación, información de contacto, redes sociales
 * y los logos de las entidades colaboradoras de Mazarrón.
 * 
 * @returns {React.ReactElement} El elemento JSX del pie de página.
 */
export default function Footer() {
    const navigate = useNavigate();

    // Referencias para realizar el seguimiento discreto de clics para el easter egg
    const clickCountRef = useRef(0);
    const lastClickTimeRef = useRef(0);

    /**
     * Controlador de clics consecutivos en el copyright del pie de página.
     * Si el usuario realiza 5 clics consecutivos en menos de 3 segundos, se le redirige al minijuego oculto.
     * 
     * @returns {void}
     */
    const handleFooterClick = () => {
        const now = Date.now();
        // Si transcurren más de 3 segundos desde la última pulsación, reiniciar el acumulador
        if (now - lastClickTimeRef.current > 3000) {
            clickCountRef.current = 1;
        } else {
            clickCountRef.current += 1;
        }
        lastClickTimeRef.current = now;

        // Se requieren 5 clics acumulados seguidos para detonar la redirección
        if (clickCountRef.current >= 5) {
            clickCountRef.current = 0;
            navigate('/relax');
        }
    };
    return (
        <footer className="bg-white border-t border-gray-100">
            <div className="w-full py-12 px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="text-lg font-black bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent uppercase tracking-wider">VoluntadMazarrón</h3>
                        <p className="mt-4 text-base text-gray-500">
                            Conectando personas con causas que importan. Únete a nosotros para hacer una diferencia en tu comunidad hoy mismo.
                        </p>
                        <div className="mt-8">
                            <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase block mb-3">Colaboran</span>
                            <div className="flex flex-wrap gap-4">
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 hover:border-brand-200 transition-all duration-300 shadow-sm hover:shadow-md flex items-center justify-center h-20 w-36 group cursor-pointer">
                                    <img 
                                        src="/images/logo-instituto.png" 
                                        alt="Logo Instituto" 
                                        className="max-h-full max-w-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            if (e.target.nextSibling) {
                                                e.target.nextSibling.style.display = 'flex';
                                            }
                                        }}
                                    />
                                    <div className="hidden text-xs text-gray-400 font-semibold text-center items-center justify-center h-full w-full uppercase tracking-wider">
                                        IES Mazarrón
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 hover:border-brand-200 transition-all duration-300 shadow-sm hover:shadow-md flex items-center justify-center h-20 w-36 group cursor-pointer">
                                    <img 
                                        src="/images/logo-ayuntamiento.png" 
                                        alt="Logo Ayuntamiento" 
                                        className="max-h-full max-w-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            if (e.target.nextSibling) {
                                                e.target.nextSibling.style.display = 'flex';
                                            }
                                        }}
                                    />
                                    <div className="hidden text-xs text-gray-400 font-semibold text-center items-center justify-center h-full w-full uppercase tracking-wider">
                                        Ayuntamiento
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Navegación</h3>
                        <ul className="mt-4 space-y-4">
                            <li>
                                <Link to="/" className="text-base text-gray-500 hover:text-brand-600 transition-colors">
                                    Inicio
                                </Link>
                            </li>
                            <li>
                                <Link to="/actividades" className="text-base text-gray-500 hover:text-brand-600 transition-colors">
                                    Actividades
                                </Link>
                            </li>
                            <li>
                                <Link to="/login" className="text-base text-gray-500 hover:text-brand-600 transition-colors">
                                    Iniciar Sesión
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Contacto</h3>
                        <ul className="mt-4 space-y-4">
                            <li className="flex items-center">
                                <Mail className="h-5 w-5 text-gray-400 mr-2" />
                                <span className="text-base text-gray-500">contacto@voluntariado.com</span>
                            </li>
                            <li className="flex space-x-6 mt-4">
                                <a href="#" className="text-gray-400 hover:text-brand-600 transition-colors">
                                    <span className="sr-only">Facebook</span>
                                    <Facebook className="h-6 w-6" />
                                </a>
                                <a href="#" className="text-gray-400 hover:text-brand-600 transition-colors">
                                    <span className="sr-only">Instagram</span>
                                    <Instagram className="h-6 w-6" />
                                </a>
                                <a href="#" className="text-gray-400 hover:text-brand-600 transition-colors">
                                    <span className="sr-only">Twitter</span>
                                    <Twitter className="h-6 w-6" />
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="mt-8 border-t border-gray-100 pt-8 text-center">
                    <p 
                        onClick={handleFooterClick}
                        className="text-base text-gray-400 select-none cursor-default"
                    >
                        &copy; 2026 Plataforma de Voluntariado. Hecho por Estefania y Ruben. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </footer>
    );
}

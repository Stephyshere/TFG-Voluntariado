import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User as UserIcon, LogOut, HeartHandshake, Search, Calendar, Newspaper, Users, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import VerifiedBadge from './ui/VerifiedBadge';
import axiosInstance from '../api/axiosInstance';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const { user, logout, token } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const searchRef = useRef(null);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Cerrar resultados al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Lógica de búsqueda
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                setIsSearching(true);
                try {
                    const response = await axiosInstance.get(`search/?q=${searchQuery}`);
                    setSearchResults(response.data.results);
                    setShowResults(true);
                } catch (error) {
                    console.error("Error en la búsqueda:", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
                setShowResults(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const getIcon = (type) => {
        switch (type) {
            case 'actividad': return <Calendar className="h-4 w-4" />;
            case 'noticia': return <Newspaper className="h-4 w-4" />;
            case 'organizacion': return <Building2 className="h-4 w-4" />;
            case 'voluntario': return <Users className="h-4 w-4" />;
            default: return <Search className="h-4 w-4" />;
        }
    };

    const isActive = (path) => location.pathname === path;

    const isHome = location.pathname === '/';

    return (
        <div className={`${isHome ? 'absolute' : 'sticky'} top-0 left-0 right-0 z-50 px-4 pt-4 transition-all duration-300`}>
            <nav className="bg-white border border-gray-100 shadow-xl shadow-brand-500/5 rounded-[2rem] max-w-7xl mx-auto transition-all duration-300">
                <div className="w-full px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                    <div className="flex items-center gap-8 lg:gap-12 flex-1">
                        <div className="flex-shrink-0 flex items-center gap-3">
                            <Link to="/" className="flex items-center gap-2 group">
                                <div className="bg-gradient-to-br from-brand-500 to-accent-500 p-2 rounded-lg text-white shadow-lg shadow-brand-500/30 group-hover:scale-105 transition-transform duration-300">
                                    <HeartHandshake className="h-8 w-8" strokeWidth={2.5} />
                                </div>
                                <span className="hidden lg:block text-2xl font-black bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent tracking-tight group-hover:opacity-80 transition-opacity">
                                    VoluntadMazarrón
                                </span>
                            </Link>
                        </div>

                        {/* Buscador Global */}
                        <div className="hidden md:block flex-1 max-w-md relative" ref={searchRef}>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar actividades, noticias, organizaciones..."
                                    className="w-full bg-gray-100/50 border-transparent focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/30 rounded-2xl py-2.5 pl-11 pr-4 text-sm transition-all duration-300 outline-none"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                                />
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                {isSearching && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-500"></div>
                                    </div>
                                )}
                            </div>

                            {/* Resultados de búsqueda */}
                            {showResults && (
                                <div className="absolute mt-2 w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="max-h-[400px] overflow-y-auto p-2">
                                        {searchResults.length > 0 ? (
                                            searchResults.map((result) => (
                                                <Link
                                                    key={`${result.type}-${result.id}`}
                                                    to={result.url}
                                                    onClick={() => setShowResults(false)}
                                                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors group"
                                                >
                                                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                        result.type === 'actividad' ? 'bg-blue-50 text-blue-600' :
                                                        result.type === 'noticia' ? 'bg-amber-50 text-amber-600' :
                                                        result.type === 'organizacion' ? 'bg-purple-50 text-purple-600' :
                                                        'bg-emerald-50 text-emerald-600'
                                                    }`}>
                                                        {getIcon(result.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-bold text-gray-900 truncate group-hover:text-brand-600 transition-colors">
                                                            {result.title}
                                                        </div>
                                                        <div className="text-xs text-gray-500 flex items-center gap-2">
                                                            <span className="capitalize">{result.type}</span>
                                                            <span>•</span>
                                                            <span className="truncate">{result.subtitle}</span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center">
                                                <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500">No hemos encontrado nada para "{searchQuery}"</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="hidden lg:flex sm:space-x-4">
                            <Link to="/">
                                <Button variant="ghost" className={`text-base font-medium transition-colors ${isActive('/') ? 'text-brand-600 bg-brand-50/50' : 'text-gray-600 hover:text-brand-600'}`}>
                                    Inicio
                                </Button>
                            </Link>
                            <Link to="/actividades">
                                <Button variant="ghost" className={`text-base font-medium transition-colors ${isActive('/actividades') ? 'text-brand-600 bg-brand-50/50' : 'text-gray-600 hover:text-brand-600'}`}>
                                    Actividades
                                </Button>
                            </Link>
                            <Link to="/noticias">
                                <Button variant="ghost" className={`text-base font-medium transition-colors ${isActive('/noticias') ? 'text-brand-600 bg-brand-50/50' : 'text-gray-600 hover:text-brand-600'}`}>
                                    Noticias
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="hidden sm:ml-6 sm:flex sm:items-center">
                        {token && user ? (
                            <div className="flex items-center space-x-6">
                                <Link to="/perfil" className="flex items-center gap-3 group hover:bg-gray-50 p-1 pr-3 rounded-full transition-all">
                                    <div className={`h-10 w-10 rounded-full border-2 border-white bg-white overflow-hidden shadow-sm transition-all duration-300 ${user.marco && user.marco !== 'ninguno' ? `frame-${user.marco} scale-95` : ''}`}>
                                        {user.foto ? (
                                            <img src={user.foto} alt="Perfil" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                                                <UserIcon className="h-5 w-5 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    <span className="hidden xl:inline text-sm font-medium text-gray-700 group-hover:text-brand-600 flex items-center gap-1">
                                        {user.first_name || user.username}
                                        {user.rol?.toLowerCase() === 'organizacion' && <VerifiedBadge className="h-4 w-4" />}
                                    </span>
                                </Link>
                                {user.rol && user.rol.toLowerCase() === 'administrador' && (
                                    <Link to="/crear-organizacion">
                                        <Button variant="outline" size="sm" className="text-brand-600 border-brand-600 hover:bg-brand-50">
                                            Añadir Org.
                                        </Button>
                                    </Link>
                                )}
                                <Button variant="ghost" size="sm" onClick={handleLogout} className="flex items-center text-red-500 hover:text-red-600 hover:bg-red-50">
                                    <LogOut className="h-4 w-4 mr-2" />
                                    <span className="hidden xl:inline">Salir</span>
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link to="/login">
                                    <Button variant="ghost" className="font-medium">Iniciar Sesión</Button>
                                </Link>
                                <Link to="/register">
                                    <Button variant="gradient" className="shadow-lg shadow-brand-500/20">
                                        Registrarse
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="-mr-2 flex items-center sm:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500"
                        >
                            <span className="sr-only">Abrir menú</span>
                            {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Menú Móvil */}
            {isOpen && (
                <div className="sm:hidden bg-white border-t border-gray-100 rounded-b-[2rem] overflow-hidden">
                    <div className="p-4">
                        <div className="relative mb-4">
                            <input
                                type="text"
                                placeholder="Buscar..."
                                className="w-full bg-gray-100 rounded-xl py-2 pl-10 pr-4 text-sm outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                        {showResults && searchResults.length > 0 && (
                            <div className="mb-4 max-h-60 overflow-y-auto space-y-2">
                                {searchResults.map(result => (
                                    <Link 
                                        key={result.id} 
                                        to={result.url} 
                                        onClick={() => {setIsOpen(false); setShowResults(false);}}
                                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg"
                                    >
                                        <div className="text-brand-500">{getIcon(result.type)}</div>
                                        <span className="text-sm font-medium truncate">{result.title}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="pt-2 pb-3 space-y-1">
                        <Link
                            to="/"
                            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isActive('/') ? 'bg-brand-50 border-brand-500 text-brand-700' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
                            onClick={() => setIsOpen(false)}
                        >
                            Inicio
                        </Link>
                        <Link
                            to="/actividades"
                            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isActive('/actividades') ? 'bg-brand-50 border-brand-500 text-brand-700' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
                            onClick={() => setIsOpen(false)}
                        >
                            Actividades
                        </Link>
                        <Link
                            to="/noticias"
                            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isActive('/noticias') ? 'bg-brand-50 border-brand-500 text-brand-700' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
                            onClick={() => setIsOpen(false)}
                        >
                            Noticias
                        </Link>
                    </div>
                    <div className="pt-4 pb-4 border-t border-gray-100">
                        {token && user ? (
                            <div className="px-4">
                                <Link to="/perfil" onClick={() => setIsOpen(false)} className="flex items-center p-3 bg-gray-50 rounded-xl mb-4 border border-gray-100">
                                    <div className={`h-12 w-12 rounded-full border-2 border-white bg-white overflow-hidden shadow-sm transition-all duration-300 ${user.marco && user.marco !== 'ninguno' ? `frame-${user.marco} scale-95` : ''}`}>
                                        {user.foto ? (
                                            <img src={user.foto} alt="Perfil" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                                                <UserIcon className="h-6 w-6 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="ml-3">
                                        <div className="text-base font-bold text-gray-800 flex items-center gap-1">
                                            {user.first_name || user.username}
                                            {user.rol?.toLowerCase() === 'organizacion' && <VerifiedBadge className="h-4 w-4" />}
                                        </div>
                                        <div className="text-xs text-gray-500 capitalize">{user.rol} • {user.asistencias_count || 0} asistencias</div>
                                    </div>
                                </Link>
                                <div className="space-y-2">
                                    {user.rol && user.rol.toLowerCase() === 'administrador' && (
                                        <Link to="/crear-organizacion" onClick={() => setIsOpen(false)}>
                                            <Button variant="outline" className="w-full justify-center">Añadir Org.</Button>
                                        </Link>
                                    )}
                                    <Button variant="danger" onClick={handleLogout} className="w-full justify-center">
                                        Cerrar Sesión
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-3 space-y-2 px-4">
                                <Link to="/login" onClick={() => setIsOpen(false)} className="block">
                                    <Button variant="outline" className="w-full justify-center">Iniciar Sesión</Button>
                                </Link>
                                <Link to="/register" onClick={() => setIsOpen(false)} className="block">
                                    <Button variant="gradient" className="w-full justify-center">Registrarse</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    </div>
    );
}

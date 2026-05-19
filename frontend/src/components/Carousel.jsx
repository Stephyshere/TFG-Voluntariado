import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/Button';
import axiosInstance from '../api/axiosInstance';
import { Link } from 'react-router-dom';

export default function Carousel() {
    const [current, setCurrent] = useState(0);
    const [slides, setSlides] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSlides = async () => {
            try {
                const response = await axiosInstance.get('anuncios/');
                // Filtrar solo actividades futuras/publicadas para el carrusel
                let activeSlides = response.data.filter(item => item.estado === 'publicado');
                
                // Limitar a máximo 5 slides
                activeSlides = activeSlides.slice(0, 5);

                // Si no hay, usar placeholders significativos
                if (activeSlides.length > 0) {
                    setSlides(activeSlides);
                } else {
                    setSlides([
                        {
                            id: 1,
                            imagen: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                            titulo: 'Ayuda a tu Comunidad',
                            descripcion: 'Únete a miles de voluntarios haciendo del mundo un lugar mejor.'
                        },
                        {
                            id: 2,
                            imagen: 'https://images.unsplash.com/photo-1542601906990-b4d3fb7d5b43?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                            titulo: 'Cuidado del Medio Ambiente',
                            descripcion: 'Participa en actividades de reforestación y limpieza de playas.'
                        },
                        {
                            id: 3,
                            imagen: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                            titulo: 'Apoyo Educativo',
                            descripcion: 'Comparte tus conocimientos y ayuda a niños y jóvenes a alcanzar su potencial.'
                        },
                        {
                            id: 4,
                            imagen: 'https://images.unsplash.com/photo-1584515933487-779824d29309?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                            titulo: 'Asistencia Sanitaria',
                            descripcion: 'Colabora en campañas de salud y bienestar para comunidades vulnerables.'
                        },
                        {
                            id: 5,
                            imagen: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                            titulo: 'Bienestar Animal',
                            descripcion: 'Ayuda en refugios y promueve la adopción responsable de mascotas.'
                        }
                    ]);
                }
            } catch (error) {
                console.error("Error cargando las diapositivas del carrusel", error);
                // Fallback en caso de error
                setSlides([
                    {
                        id: 1,
                        imagen: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                        titulo: 'Ayuda a tu Comunidad',
                        descripcion: 'Únete a miles de voluntarios haciendo del mundo un lugar mejor.'
                    },
                    {
                        id: 2,
                        imagen: 'https://images.unsplash.com/photo-1542601906990-b4d3fb7d5b43?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                        titulo: 'Cuidado del Medio Ambiente',
                        descripcion: 'Participa en actividades de reforestación y limpieza de playas.'
                    },
                    {
                        id: 3,
                        imagen: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                        titulo: 'Apoyo Educativo',
                        descripcion: 'Comparte tus conocimientos y ayuda a niños y jóvenes a alcanzar su potencial.'
                    },
                    {
                        id: 4,
                        imagen: 'https://images.unsplash.com/photo-1584515933487-779824d29309?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                        titulo: 'Asistencia Sanitaria',
                        descripcion: 'Colabora en campañas de salud y bienestar para comunidades vulnerables.'
                    },
                    {
                        id: 5,
                        imagen: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                        titulo: 'Bienestar Animal',
                        descripcion: 'Ayuda en refugios y promueve la adopción responsable de mascotas.'
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchSlides();
    }, []);

    useEffect(() => {
        if (slides.length <= 1) return;
        const timer = setInterval(() => {
            setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
        }, 5000);
        return () => clearInterval(timer);
    }, [slides]);

    const nextSlide = () => {
        setCurrent(current === slides.length - 1 ? 0 : current + 1);
    };

    const prevSlide = () => {
        setCurrent(current === 0 ? slides.length - 1 : current - 1);
    };

    if (loading || slides.length === 0) return <div className="h-screen bg-gray-900 animate-pulse" />;

    return (
        <div className="relative h-screen w-full overflow-hidden bg-gray-900">
            <AnimatePresence mode='wait'>
                <motion.div
                    key={current}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                >
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${slides[current].imagen || "https://images.unsplash.com/photo-1593113598332-cd288d649433"})` }}
                    >
                        <div className="absolute inset-0 bg-black/50" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center text-center px-4">
                        <div className="max-w-3xl">
                            <motion.h2
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg"
                            >
                                {slides[current].titulo}
                            </motion.h2>
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto leading-relaxed shadow-black drop-shadow-md"
                            >
                                {slides[current].descripcion}
                            </motion.p>
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                            >
                                <Link to={slides[current].id ? `/actividades/${slides[current].id}` : '/actividades'}>
                                    <Button variant="gradient" size="lg" className="mr-4 text-lg px-8 py-4 rounded-full shadow-xl hover:shadow-2xl transition-all border-0">
                                        {slides[current].id ? 'Ver Más' : 'Únete Ahora'}
                                    </Button>
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {slides.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
                    >
                        <ChevronLeft className="h-8 w-8" />
                    </button>

                    <button
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
                    >
                        <ChevronRight className="h-8 w-8" />
                    </button>

                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrent(index)}
                                className={`w-3 h-3 rounded-full transition-colors ${index === current ? 'bg-white' : 'bg-white/40'
                                    }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

import React, { useEffect, useState } from 'react';
import Layout from '../layouts/Layout';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Search, Newspaper } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

export default function News() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);

    // Obtiene las actividades finalizadas o pasadas para mostrarlas como noticias en la página de noticias --ESTEFANIA
    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await axiosInstance.get('anuncios/');
                // Filtrar solo las actividades finalizadas o pasadas
                // Asumimos que 'finalizado' es el estado para noticias, o filtramos por fecha
                const allActivities = response.data;
                const pastActivities = allActivities.filter(activity =>
                    activity.estado === 'finalizado' || new Date(activity.fecha_evento) < new Date()
                );
                setNews(pastActivities);
            } catch (error) {
                console.error("Error al obtener noticias:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    return (
        <Layout>
            <div className="bg-gradient-to-r from-accent-600 to-brand-600 py-16">
                <div className="w-full px-6 text-center">
                    <h1 className="text-3xl font-extrabold text-white sm:text-5xl drop-shadow-sm">
                        Noticias y Actividades Realizadas
                    </h1>
                    <p className="mt-4 text-xl text-indigo-100 max-w-2xl mx-auto">
                        Descubre el impacto positivo que hemos logrado juntos.
                    </p>
                </div>
            </div>

            <div className="w-full px-6 py-12">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {news.length > 0 ? (
                            news.map((item) => (
                                <Card key={item.id} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border-0 bg-white">
                                    <div className="h-56 overflow-hidden relative group">
                                        <img
                                            src={item.noticia_imagen || item.imagen || "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"}
                                            alt={item.titulo}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0">
                                            <span className="bg-brand-500/90 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                                                Noticia
                                            </span>
                                        </div>
                                    </div>
                                    <CardContent className="p-6">
                                        <div className="flex items-center text-sm text-gray-400 mb-3">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            <span>{new Date(item.fecha_evento).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-3 leading-tight group-hover:text-brand-600 transition-colors">
                                            {item.titulo}
                                        </h3>
                                        <p className="text-gray-600 mb-6 line-clamp-3 text-base">
                                            {item.noticia_resumen || item.descripcion}
                                        </p>
                                        <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                            <span className="text-sm font-medium text-brand-600 flex items-center">
                                                <MapPin className="h-4 w-4 mr-1" />
                                                {item.nombre_pedania}
                                            </span>
                                            <Link to={`/actividades/${item.id}`}>
                                                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-brand-600 p-0">
                                                    Leer más →
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="col-span-3 text-center py-20 px-4 bg-gray-50 rounded-3xl">
                                <Newspaper className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-medium text-gray-900">Aún no hay noticias</h3>
                                <p className="text-gray-500 mt-2">Pronto publicaremos las actividades que vayamos realizando.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
}

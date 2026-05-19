import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../layouts/Layout';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Calendar, MapPin, Users, Search } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

export default function Activities() {
    const [activities, setActivities] = useState([]);
    const [filteredActivities, setFilteredActivities] = useState([]);
    const [pedanias, setPedanias] = useState([]);
    const [selectedPedania, setSelectedPedania] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    //vincula las actividades con las pedanias para mostrar el nombre de la pedania en cada actividad --Estefania
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [activitiesRes, pedaniasRes] = await Promise.all([
                    axiosInstance.get('anuncios/'),
                    axiosInstance.get('pedanias/')
                ]);

                // Filtrar solo actividades publicadas (futuras) si el backend no filtra
                const futureActivities = activitiesRes.data.filter(a => a.estado === 'publicado');
                setActivities(futureActivities);
                setFilteredActivities(futureActivities);
                setPedanias(pedaniasRes.data);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filtra las actividades cada vez que cambia el término de búsqueda, la pedanía seleccionada o la lista de actividades --ESTEFANIA
    useEffect(() => {
        let results = activities;

        if (searchTerm) {
            results = results.filter(activity =>
                activity.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                activity.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (selectedPedania) {
            results = results.filter(activity =>
                activity.nombre_pedania === selectedPedania
            );
        }

        setFilteredActivities(results);
    }, [searchTerm, selectedPedania, activities]);

    return (
        <Layout>
            <div className="bg-gradient-to-r from-accent-600 to-brand-600 py-16">
                <div className="w-full px-6 text-center">
                    <h1 className="text-3xl font-extrabold text-white sm:text-5xl drop-shadow-sm">
                        Explora Oportunidades de Voluntariado
                    </h1>
                    <p className="mt-4 text-xl text-indigo-100 max-w-2xl mx-auto">
                        Encuentra la actividad perfecta para ti y comienza a ayudar hoy mismo.
                    </p>
                </div>
            </div>

            <div className="w-full px-6 py-12">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                            type="text"
                            placeholder="Buscar actividades..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="w-full md:w-64">
                        <select
                            className="w-full h-10 px-3 py-2 text-sm border-2 border-dashed border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                            value={selectedPedania}
                            onChange={(e) => setSelectedPedania(e.target.value)}
                        >
                            <option value="">Todas las Pedanías</option>
                            {pedanias.map((pedania) => (
                                <option key={pedania.id} value={pedania.nombre}>
                                    {pedania.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredActivities.map((activity) => (
                            <Card key={activity.id} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border-0 bg-white h-full flex flex-col">
                                <div className="h-56 overflow-hidden relative group">
                                    <img
                                        src={activity.imagen || "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"}
                                        alt={activity.titulo}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-brand-600 shadow-sm z-10">
                                        {activity.nombre_pedania}
                                    </div>
                                </div>
                                <CardContent className="flex-grow flex flex-col">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{activity.titulo}</h3>
                                    <p className="text-gray-600 mb-4 line-clamp-3 flex-grow">{activity.descripcion}</p>

                                    <div className="space-y-2 text-sm text-gray-500 mb-6">
                                        <div className="flex items-center">
                                            <Calendar className="h-4 w-4 mr-2 text-brand-500" />
                                            <span>{new Date(activity.fecha_evento).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <Users className="h-4 w-4 mr-2 text-brand-500" />
                                            <span>{activity.cupo_maximo} plazas máx</span>
                                        </div>
                                    </div>

                                    <Link to={`/actividades/${activity.id}`} className="w-full mt-auto">
                                        <Button className="w-full">
                                            Ver Detalles
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {!loading && filteredActivities.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No se encontraron actividades que coincidan con tu búsqueda.
                    </div>
                )}
            </div>
        </Layout>
    );
}

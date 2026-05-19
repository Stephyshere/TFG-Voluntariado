import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../layouts/Layout';
import { Button } from '../components/ui/Button';
import { Calendar, MapPin, Users, Clock, ArrowLeft, Share2, Sparkles, Newspaper, FileText, CheckSquare, PlayCircle, X } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function ActivityDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const [activity, setActivity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasJoined, setHasJoined] = useState(false);
    const [joining, setJoining] = useState(false);
    const [inscripciones, setInscripciones] = useState([]);
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);

    // Comprueba si el usuario actual es propietario del anuncio o administrador
    const isOwnerOrAdmin = user && (user.rol?.toLowerCase() === 'administrador' || user.id === activity?.usuario);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const response = await axiosInstance.get(`anuncios/${id}/`);
                setActivity(response.data);

                if (token) {
                    const inscripcionesParams = await axiosInstance.get('inscripciones/');
                    const isJoined = inscripcionesParams.data.some(insc => insc.anuncio === parseInt(id));
                    setHasJoined(isJoined);

                    // Cargar inscripciones si es propietario o administrador
                    const isOwnerOrAdm = user && (user.rol?.toLowerCase() === 'administrador' || user.id === response.data.usuario);
                    if (isOwnerOrAdm) {
                        const inscResponse = await axiosInstance.get(`inscripciones/?anuncio=${id}`);
                        setInscripciones(inscResponse.data);
                    }
                }
            } catch (err) {
                console.error("Error al cargar los detalles de la actividad:", err);
                setError("No se pudo cargar la actividad.");
            } finally {
                setLoading(false);
            }
        };

        fetchActivity();
    }, [id, token, user]);

    const handleJoin = async () => {
        if (!token) return navigate('/login');
        setJoining(true);
        try {
            await axiosInstance.post('inscripciones/', {
                anuncio: id,
                estado: 'pendiente'
            });
            setHasJoined(true);
            setActivity(prev => ({
                ...prev,
                inscripciones_count: (prev.inscripciones_count || 0) + 1,
                plazas_restantes: (prev.plazas_restantes && prev.plazas_restantes > 0) ? prev.plazas_restantes - 1 : prev.plazas_restantes
            }));
        } catch (error) {
            console.error("Error joining activity", error);
            alert("Error al inscribirse. Inténtalo de nuevo.");
        } finally {
            setJoining(false);
        }
    };

    const handleStartActivity = async () => {
        try {
            await axiosInstance.patch(`anuncios/${id}/`, { estado: 'en_curso' });
            setActivity(prev => ({ ...prev, estado: 'en_curso' }));
            alert("Actividad marcada como comenzada.");
        } catch (error) {
            console.error("Error starting activity", error);
            alert("Error al cambiar el estado.");
        }
    };

    //Descarga la lista de inscritos en formato PDF --ESTEFANIA
    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        doc.text(`Lista de Inscritos: ${activity.titulo}`, 14, 15); //Muestra el titulo de la actividad
        const tableData = inscripciones.map((insc, index) => [
            index + 1,
            insc.nombre_real,
            insc.nombre_usuario,
            insc.asistido ? "Sí" : "No"
        ]);

        doc.autoTable({
            head: [['Nº', 'Nombre Real', 'Usuario', 'Asistió']],
            body: tableData,
            startY: 25,
        });

        doc.save(`inscritos_${activity.id}.pdf`);
    };

    const openAttendanceModal = () => {
        setSelectedUsers(inscripciones.filter(i => i.asistido).map(i => i.id));
        setShowAttendanceModal(true);
    };

    const handleSaveAttendance = async () => {
        try {
            await axiosInstance.post(`anuncios/${id}/pasar_lista/`, {
                inscripciones_ids: selectedUsers
            });
            // Actualizar estado local
            setInscripciones(prev => prev.map(insc => ({
                ...insc,
                asistido: selectedUsers.includes(insc.id)
            })));
            setShowAttendanceModal(false);
            alert("Asistencia guardada correctamente.");
        } catch (error) {
            console.error("Error saving attendance", error);
            alert("Error al guardar la asistencia.");
        }
    };

    const toggleUserAttendance = (inscId) => {      //Marca la asistencia de un usuario
        setSelectedUsers(prev =>
            prev.includes(inscId) ? prev.filter(id => id !== inscId) : [...prev, inscId]
        );
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-screen bg-gray-50">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-600"></div>
                </div>
            </Layout>
        );
    }

    if (error || !activity) {
        return (
            <Layout>
                <div className="flex flex-col justify-center items-center h-screen bg-gray-50 px-4">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Actividad no encontrada</h2>
                    <Button onClick={() => navigate(-1)} variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver atrás
                    </Button>
                </div>
            </Layout>
        );
    }

    const isFinished = activity.estado === 'finalizado';

    return (
        <Layout>
            <div className="min-h-screen bg-gray-50 pb-20">
                {/* Imagen principal */}
                <div className="relative h-[50vh] w-full">
                    <img
                        src={activity.imagen || "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"}
                        alt={activity.titulo}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent" />

                    <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 text-white">
                        <div className="max-w-5xl mx-auto">
                            <Button
                                onClick={() => navigate(-1)}
                                variant="ghost"
                                className="text-white/80 hover:text-white hover:bg-white/10 mb-6 p-0"
                            >
                                <ArrowLeft className="mr-2 h-5 w-5" /> Volver
                            </Button>
                            <div className="flex items-center space-x-4 mb-4">
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${isFinished
                                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                        : activity.estado === 'en_curso'
                                            ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                                            : 'bg-green-500/20 text-green-300 border-green-500/30'}`}>
                                    {isFinished ? 'Finalizado' : activity.estado === 'en_curso' ? 'En Curso' : 'Abierto'}
                                </span>
                                <span className="text-gray-300 text-sm flex items-center">
                                    <MapPin className="h-4 w-4 mr-1" /> {activity.nombre_pedania}
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4">
                                {activity.titulo}
                            </h1>
                        </div>
                    </div>
                </div>

                {/* Contenido principal */}
                <div className="max-w-5xl mx-auto px-6 -mt-10 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Informacion principal */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Sobre esta actividad</h2>
                                <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-line">
                                    {activity.descripcion}
                                </p>
                            </div>

                            {/* SECCIÓN DE NOTICIA / RESULTADOS (Solo si existen) */}
                            {activity.noticia_resumen && (
                                <div className="bg-gradient-to-br from-blue-50 to-white rounded-3xl p-8 shadow-xl border border-blue-100 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="bg-blue-600 p-2 rounded-xl text-white">
                                            <Newspaper className="h-6 w-6" />
                                        </div>
                                        <h2 className="text-2xl font-black text-blue-900">Resultados e Impacto</h2>
                                        <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
                                    </div>

                                    <div className="prose prose-blue max-w-none">
                                        <p className="text-xl text-blue-800 font-medium leading-relaxed italic">
                                            "{activity.noticia_resumen}"
                                        </p>
                                    </div>

                                    {activity.noticia_imagen && (
                                        <div className="mt-8 rounded-2xl overflow-hidden shadow-lg border-4 border-white">
                                            <img
                                                src={activity.noticia_imagen}
                                                alt="Resultado de la actividad"
                                                className="w-full h-auto object-cover max-h-[400px]"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Requerimientos Dinámicos */}
                            {activity.requerimientos && (
                                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">Cosas que necesitas</h3>
                                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                                        {activity.requerimientos.split('\n').filter(line => line.trim() !== '').map((line, index) => (
                                            <li key={index}>{line}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Barra lateral */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 sticky top-24">
                                <h3 className="text-lg font-bold text-gray-900 mb-6">Detalles del Evento</h3>

                                <div className="space-y-6">
                                    <div className="flex items-start">
                                        <div className="bg-brand-50 p-2 rounded-lg mr-4">
                                            <Calendar className="h-6 w-6 text-brand-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 font-medium">Fecha</p>
                                            <p className="text-gray-900 font-semibold text-lg">
                                                {new Date(activity.fecha_evento).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <div className="bg-brand-50 p-2 rounded-lg mr-4">
                                            <Clock className="h-6 w-6 text-brand-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 font-medium">Hora</p>
                                            <p className="text-gray-900 font-semibold text-lg">
                                                {new Date(activity.fecha_evento).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>

                                    {!isFinished && (
                                        <div className="flex items-start">
                                            <div className="bg-brand-50 p-2 rounded-lg mr-4">
                                                <Users className="h-6 w-6 text-brand-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 font-medium">Plazas</p>
                                                <p className="text-gray-900 font-semibold text-lg">
                                                    {activity.cupo_maximo > 0 ? (
                                                        <>
                                                            {activity.inscripciones_count || 0} / {activity.cupo_maximo} inscritos
                                                        </>
                                                    ) : (
                                                        `${activity.inscripciones_count || 0} inscritos (Plazas Ilimitadas)`
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-6 border-t border-gray-100">
                                        {isFinished ? (
                                            <div className="bg-blue-50 p-4 rounded-2xl text-center border border-blue-100">
                                                <p className="text-blue-700 font-bold mb-1">¡Evento Completado!</p>
                                                <p className="text-blue-500 text-xs">Ya no admite más inscripciones.</p>
                                            </div>
                                        ) : user ? (
                                            hasJoined ? (
                                                <Button className="w-full py-6 text-lg bg-green-600 hover:bg-green-700 text-white cursor-default">
                                                    ¡Ya estás inscrito!
                                                </Button>
                                            ) : (
                                                <Button
                                                    onClick={handleJoin}
                                                    disabled={joining || (activity.cupo_maximo > 0 && (activity.inscripciones_count || 0) >= activity.cupo_maximo) || activity.estado === 'en_curso'}
                                                    className={`w-full py-6 text-lg shadow-lg shadow-brand-500/30 ${((activity.cupo_maximo > 0 && (activity.inscripciones_count || 0) >= activity.cupo_maximo) || activity.estado === 'en_curso') ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    {joining ? 'Inscribiendo...' : ((activity.cupo_maximo === 0 || (activity.inscripciones_count || 0) < activity.cupo_maximo) && activity.estado !== 'en_curso' ? 'Inscribirme Ahora' : 'No disponible')}
                                                </Button>
                                            )
                                        ) : (
                                            <div className="text-center">
                                                <Button onClick={() => navigate('/login')} className="w-full py-6 text-lg mb-2">
                                                    Inicia Sesión para Inscribirte
                                                </Button>
                                                <p className="text-xs text-gray-400">
                                                    Es necesario tener cuenta para participar.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {isOwnerOrAdmin && (
                                        <div className="pt-6 border-t border-gray-100 space-y-3">
                                            <h4 className="font-semibold text-gray-900 text-center mb-4">Panel de Administración</h4>

                                            {activity.estado === 'publicado' && (
                                                <Button onClick={handleStartActivity} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white">
                                                    <PlayCircle className="w-4 h-4 mr-2" />
                                                    Marcar como Comenzada
                                                </Button>
                                            )}

                                            {(activity.estado === 'en_curso' || activity.estado === 'finalizado') && (
                                                <>
                                                    <Button onClick={handleDownloadPDF} variant="outline" className="w-full border-blue-500 text-blue-600 hover:bg-blue-50">
                                                        <FileText className="w-4 h-4 mr-2" />
                                                        Descargar Lista (PDF)
                                                    </Button>
                                                    <Button onClick={openAttendanceModal} className="w-full bg-brand-600 hover:bg-brand-700 text-white">
                                                        <CheckSquare className="w-4 h-4 mr-2" />
                                                        Pasar Lista Digital
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de asistencia. Este modal permite a los usuarios marcar la asistencia de los voluntarios en una actividad. Estefania*/}
            {showAttendanceModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">Pasar Lista: {activity.titulo}</h3>
                            <button onClick={() => setShowAttendanceModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto mb-6">
                            {inscripciones.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No hay inscritos en esta actividad.</p>
                            ) : (
                                <div className="space-y-2">
                                    {inscripciones.map((insc, index) => (
                                        <div key={insc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => toggleUserAttendance(insc.id)}>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900">{index + 1}. {insc.nombre_real}</span>
                                                <span className="text-sm text-gray-500">@{insc.nombre_usuario}</span>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.includes(insc.id)}
                                                onChange={() => toggleUserAttendance(insc.id)}
                                                className="w-6 h-6 text-brand-600 rounded border-gray-300 focus:ring-brand-500 cursor-pointer pointer-events-none"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <Button variant="outline" onClick={() => setShowAttendanceModal(false)}>Cancelar</Button>
                            <Button onClick={handleSaveAttendance} className="bg-brand-600 text-white hover:bg-brand-700">
                                Guardar Asistencia
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}

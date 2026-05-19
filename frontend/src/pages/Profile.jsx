import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../layouts/Layout';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { User, Mail, Calendar, MapPin, Phone, Briefcase, Camera, X, Edit2, ShieldCheck, Newspaper, Sparkles, Image as ImageIcon, Trash2, CheckCircle2 } from 'lucide-react';
import VerifiedBadge from '../components/ui/VerifiedBadge';

export default function Profile() {
    const { id } = useParams();
    const { user: currentUser, token } = useAuth();
    const navigate = useNavigate();
    
    const [profileUser, setProfileUser] = useState(null);
    const [inscriptions, setInscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    const [myActivities, setMyActivities] = useState([]);
    const [pedanias, setPedanias] = useState([]);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState(null);
    const [activityForm, setActivityForm] = useState({
        titulo: '', descripcion: '', fecha_evento: '', etiqueta: 'otros', estado: 'borrador', cupo_maximo: 0, pedanias: '', requerimientos: ''
    });
    const [activityImage, setActivityImage] = useState(null);
    const [activityToDelete, setActivityToDelete] = useState(null);

    // Estado para el modal de "Hazla Noticia"
    const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
    const [newsForm, setNewsForm] = useState({
        noticia_resumen: '',
    });
    const [newsImage, setNewsImage] = useState(null);
    const [newsPreview, setNewsPreview] = useState(null);

    const [formData, setFormData] = useState({});
    const [previewImage, setPreviewImage] = useState(null);
    const [saveLoading, setSaveLoading] = useState(false);

    const isOwnProfile = !id || (currentUser && parseInt(id) === currentUser.id);

    useEffect(() => {
        const fetchProfileData = async () => {
            setLoading(true);
            try {
                let userData = null;
                if (isOwnProfile) {
                    const res = await axiosInstance.get('me/');
                    userData = res.data;
                } else {
                    const res = await axiosInstance.get(`perfiles/${id}/`);
                    userData = res.data;
                }
                setProfileUser(userData);

                if (isOwnProfile) {
                    const response = await axiosInstance.get('inscripciones/');
                    setInscriptions(response.data);
                }

                if (userData.rol === 'organizacion') {
                    const [anunciosRes, pedaniasRes] = await Promise.all([
                        axiosInstance.get('anuncios/'),
                        axiosInstance.get('pedanias/')
                    ]);
                    // Se compara con userData.user.id (ID del User) porque a.usuario es el ID del User
                    const orgActs = anunciosRes.data.filter(a => a.usuario === userData.user.id);
                    setMyActivities(isOwnProfile ? orgActs : orgActs.filter(a => a.estado === 'publicado'));
                    setPedanias(pedaniasRes.data);
                }
            } catch (error) {
                console.error("Error al cargar datos del perfil", error);
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchProfileData();
    }, [id, token, currentUser, isOwnProfile]);

    useEffect(() => {
        if (profileUser && isOwnProfile) {
            setFormData({
                first_name: profileUser.first_name || '',
                last_name: profileUser.last_name || '',
                email: profileUser.email || '',
                telefono: profileUser.telefono || '',
                fecha_nacimiento: profileUser.fecha_nacimiento || '',
                nombre_entidad: profileUser.nombre_entidad || '',
            });
        }
    }, [profileUser, isEditing, isOwnProfile]);

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, foto: file });
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaveLoading(true);
        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null && formData[key] !== undefined) {
                data.append(key, formData[key]);
            }
        });
        try {
            await axiosInstance.put('me/', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            window.location.reload();
        } catch (error) {
            console.error("Error al actualizar el perfil", error);
        } finally {
            setSaveLoading(false);
            setIsEditing(false);
        }
    };

    // Gestión de actividades
    const handleActivityInputChange = (e) => setActivityForm({ ...activityForm, [e.target.name]: e.target.value });
    const handleActivityImageChange = (e) => {
        const file = e.target.files[0];
        if (file) setActivityImage(file);
    };

    const openCreateActivityModal = () => {
        setEditingActivity(null);
        setActivityForm({ titulo: '', descripcion: '', fecha_evento: '', etiqueta: 'otros', estado: 'borrador', cupo_maximo: 0, pedanias: pedanias[0]?.id || '', requerimientos: '' });
        setActivityImage(null);
        setIsActivityModalOpen(true);
    };

    const openEditActivityModal = (activity) => {
        setEditingActivity(activity);
        let formattedDate = '';
        if (activity.fecha_evento) {
            const dateObj = new Date(activity.fecha_evento);
            formattedDate = dateObj.toISOString().slice(0, 16);
        }
        setActivityForm({
            titulo: activity.titulo,
            descripcion: activity.descripcion,
            fecha_evento: formattedDate,
            etiqueta: activity.etiqueta,
            estado: activity.estado,
            cupo_maximo: activity.cupo_maximo,
            pedanias: activity.pedanias,
            requerimientos: activity.requerimientos || ''
        });
        setActivityImage(null);
        setIsActivityModalOpen(true);
    };

    const handleSaveActivity = async (e) => {
        e.preventDefault();
        const data = new FormData();
        Object.keys(activityForm).forEach(key => data.append(key, activityForm[key]));
        if (activityImage) data.append('imagen', activityImage);

        try {
            let response;
            if (editingActivity) {
                response = await axiosInstance.put(`anuncios/${editingActivity.id}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
                if (activityForm.estado === 'finalizado' && editingActivity.estado !== 'finalizado') {
                    setEditingActivity(response.data);
                    setNewsForm({ noticia_resumen: response.data.noticia_resumen || '' });
                    setIsNewsModalOpen(true);
                } else {
                    window.location.reload();
                }
            } else {
                response = await axiosInstance.post('anuncios/', data, { headers: { 'Content-Type': 'multipart/form-data' } });
                if (activityForm.estado === 'finalizado') {
                    setEditingActivity(response.data);
                    setIsNewsModalOpen(true);
                } else {
                    window.location.reload();
                }
            }
            setIsActivityModalOpen(false);
        } catch (error) {
            console.error("Error saving activity", error);
            alert("Error al guardar la actividad.");
        }
    };

    const handleFinalizeActivity = async (activity) => {
        try {
            const response = await axiosInstance.patch(`anuncios/${activity.id}/`, { estado: 'finalizado' });
            setEditingActivity(response.data);
            setNewsForm({ noticia_resumen: response.data.noticia_resumen || '' });
            setIsNewsModalOpen(true);
        } catch (error) {
            console.error("Error al finalizar actividad", error);
            alert("No se pudo finalizar la actividad.");
        }
    };

    const handleSaveNews = async (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append('noticia_resumen', newsForm.noticia_resumen);
        if (newsImage) data.append('noticia_imagen', newsImage);

        try {
            await axiosInstance.patch(`anuncios/${editingActivity.id}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
            setIsNewsModalOpen(false);
            window.location.reload();
        } catch (error) {
            console.error("Error saving news", error);
            alert("Error al publicar la noticia.");
        }
    };

    const handleNewsImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewsImage(file);
            setNewsPreview(URL.createObjectURL(file));
        }
    };

    const handleDeleteActivity = (activity) => setActivityToDelete(activity);
    const confirmDeleteActivity = async () => {
        try {
            await axiosInstance.delete(`anuncios/${activityToDelete.id}/`);
            setMyActivities(myActivities.filter(a => a.id !== activityToDelete.id));
            setActivityToDelete(null);
        } catch (error) {
            console.error("Error deleting activity", error);
        }
    };

    // Separar actividades activas de finalizadas
    const activeActivities = myActivities.filter(a => a.estado !== 'finalizado');
    const finishedActivities = myActivities.filter(a => a.estado === 'finalizado');

    const ActivityCard = ({ activity }) => (
        <div key={activity.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 flex flex-col group hover:shadow-lg transition-all">
            <div className="h-40 overflow-hidden relative">
                <img src={activity.imagen || "https://via.placeholder.com/400x200?text=No+Image"} alt={activity.titulo} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                <div className={`absolute top-2 right-2 px-2 py-1 text-[10px] font-bold rounded-full text-white uppercase ${
                    activity.estado === 'publicado' ? 'bg-green-500' : 
                    activity.estado === 'finalizado' ? 'bg-blue-600' : 'bg-amber-500'}`}>
                    {activity.estado}
                </div>
            </div>
            <div className="p-4 flex-grow flex flex-col">
                <h3 className="font-bold text-lg mb-2 line-clamp-1">{activity.titulo}</h3>
                <p className="text-gray-500 text-xs mb-4 line-clamp-2 flex-grow">{activity.descripcion}</p>
                
                {isOwnProfile ? (
                    <div className="space-y-2 mt-auto">
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1 py-1" onClick={() => openEditActivityModal(activity)}>
                                <Edit2 className="h-3.5 w-3.5 mr-1" /> Editar
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1 py-1 text-red-600 border-red-100 hover:bg-red-50" onClick={() => handleDeleteActivity(activity)}>
                                <Trash2 className="h-3.5 w-3.5 mr-1" /> Borrar
                            </Button>
                        </div>
                        {activity.estado !== 'finalizado' ? (
                            <Button variant="gradient" size="sm" className="w-full py-1.5" onClick={() => handleFinalizeActivity(activity)}>
                                <CheckCircle2 className="h-4 w-4 mr-2" /> Finalizar Actividad
                            </Button>
                        ) : (
                            <Button variant="ghost" size="sm" className="w-full py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100" onClick={() => {
                                setEditingActivity(activity);
                                setNewsForm({ noticia_resumen: activity.noticia_resumen || '' });
                                setIsNewsModalOpen(true);
                            }}>
                                <Newspaper className="h-4 w-4 mr-2" /> Editar Noticia
                            </Button>
                        )}
                    </div>
                ) : (
                    <Button variant="gradient" size="sm" className="w-full mt-auto" onClick={() => navigate(`/actividades/${activity.id}`)}>Ver Detalles</Button>
                )}
            </div>
        </div>
    );

    if (loading) return <Layout><div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div></div></Layout>;
    if (!profileUser) return <Layout><div className="text-center py-20">Usuario no encontrado.</div></Layout>;

    return (
        <Layout>
            <div className="max-w-4xl mx-auto px-4 py-12">
                {/* Perfil Header */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 relative group">
                    <div className="bg-gradient-to-r from-brand-600 to-accent-600 h-32 relative">
                        {profileUser.rol === 'organizacion' && (
                            <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3" /> Entidad Verificada
                            </div>
                        )}
                    </div>
                    <div className="px-8 pb-8">
                        <div className="relative flex justify-between items-end -mt-12 mb-6">
                            <div className="relative">
                                <div className={`h-28 w-28 rounded-full border-4 border-white bg-white overflow-hidden shadow-md transition-all duration-300 ${profileUser.marco && profileUser.marco !== 'ninguno' ? `frame-${profileUser.marco}` : ''}`}>
                                    {profileUser.foto ? (
                                        <img src={profileUser.foto} alt="Perfil" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                                            <User className="h-12 w-12 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            {isOwnProfile && (
                                <Button variant="outline" onClick={() => setIsEditing(true)}>
                                    <Edit2 className="h-4 w-4 mr-2" /> Editar Perfil
                                </Button>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                                    {profileUser.rol === 'organizacion' ? (profileUser.nombre_entidad || profileUser.username) : `${profileUser.first_name} ${profileUser.last_name}`}
                                    {profileUser.rol === 'organizacion' && <VerifiedBadge className="h-6 w-6" />}
                                </h1>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 mt-1">
                                <p className="text-gray-500 font-medium">@{profileUser.username} • {profileUser.rol.charAt(0).toUpperCase() + profileUser.rol.slice(1)}</p>
                                {profileUser.rol === 'voluntario' && (
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                                        profileUser.marco === 'oro' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                        profileUser.marco === 'plata' ? 'bg-gray-100 text-gray-700 border border-gray-200' :
                                        profileUser.marco === 'bronce' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                        'bg-brand-50 text-brand-700 border border-brand-100'
                                    }`}>
                                        {profileUser.asistencias_count || 0} asistencias
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Secciones de Contenido */}
                {isOwnProfile && (
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Mis Inscripciones</h2>
                        {inscriptions.length > 0 ? (
                            <div className="grid gap-4">
                                {inscriptions.map((inscription) => (
                                    <div key={inscription.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center group hover:shadow-md transition-shadow">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-800 mb-1">{inscription.titulo_anuncio}</h3>
                                            <p className="text-gray-500 text-sm flex items-center gap-2">
                                                <Calendar className="h-3 w-3" /> Inscrito el {new Date(inscription.fecha_inscripcion).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${inscription.asistido ? 'bg-green-100 text-green-700' : 'bg-brand-50 text-brand-600'}`}>
                                            {inscription.asistido ? 'Asistido' : 'Confirmado'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                                <p className="text-gray-500 mb-4">No te has inscrito a ninguna actividad aún.</p>
                                <Button variant="gradient" onClick={() => navigate('/actividades')}>Explorar Actividades</Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Gestión de Actividades (Organización) */}
                {profileUser.rol === 'organizacion' && (
                    <>
                        {/* SECCIÓN 1: Actividades Activas */}
                        <div className="mt-12">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-800">
                                    {isOwnProfile ? 'Actividades Activas' : 'Actividades Disponibles'}
                                </h2>
                                {isOwnProfile && (
                                    <Button className="bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/20" onClick={openCreateActivityModal}>
                                        + Crear Actividad
                                    </Button>
                                )}
                            </div>
                            {activeActivities.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {activeActivities.map(activity => <ActivityCard key={activity.id} activity={activity} />)}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                                    <p className="text-gray-500">No hay actividades activas actualmente.</p>
                                </div>
                            )}
                        </div>

                        {/* SECCIÓN 2: Noticias y Resultados (Actividades Finalizadas) */}
                        <div className="mt-16">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-blue-100 p-2 rounded-lg">
                                    <Newspaper className="h-5 w-5 text-blue-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">
                                    {isOwnProfile ? 'Noticias y Resultados' : 'Actividades Realizadas'}
                                </h2>
                            </div>
                            {finishedActivities.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {finishedActivities.map(activity => <ActivityCard key={activity.id} activity={activity} />)}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                                    <p className="text-gray-500">Aún no hay noticias publicadas.</p>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* MODAL: Hazla Noticia! */}
                {isNewsModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-300">
                            <div className="bg-gradient-to-r from-blue-600 to-brand-600 p-8 text-white relative">
                                <div className="absolute top-4 right-4 bg-white/20 p-2 rounded-full cursor-pointer hover:bg-white/30 transition-colors" onClick={() => setIsNewsModalOpen(false)}>
                                    <X className="h-5 w-5" />
                                </div>
                                <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
                                    <Sparkles className="h-8 w-8 text-yellow-300" />
                                </div>
                                <h2 className="text-3xl font-black mb-2">¡Hazla noticia!</h2>
                                <p className="text-blue-100">Cuéntale a la comunidad qué habéis conseguido en <strong>{editingActivity?.titulo}</strong>.</p>
                            </div>
                            
                            <form onSubmit={handleSaveNews} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Resultados de la actividad</label>
                                    <textarea 
                                        className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 text-gray-700 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                                        placeholder="¿Cuántas personas asistieron? ¿Qué impacto habéis tenido?..."
                                        rows="4"
                                        value={newsForm.noticia_resumen}
                                        onChange={(e) => setNewsForm({...newsForm, noticia_resumen: e.target.value})}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Imagen del logro</label>
                                    <div 
                                        className="relative group cursor-pointer"
                                        onClick={() => document.getElementById('news-image-input').click()}
                                    >
                                        <div className="h-48 w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden flex items-center justify-center group-hover:border-brand-300 transition-colors">
                                            {newsPreview ? (
                                                <img src={newsPreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-center">
                                                    <ImageIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                                    <p className="text-xs text-gray-400">Sube una foto del evento finalizado</p>
                                                </div>
                                            )}
                                        </div>
                                        <input 
                                            id="news-image-input"
                                            type="file" 
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={handleNewsImageChange}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <Button type="button" variant="ghost" className="flex-1 rounded-2xl" onClick={() => setIsNewsModalOpen(false)}>
                                        Más tarde
                                    </Button>
                                    <Button type="submit" className="flex-1 rounded-2xl shadow-lg shadow-brand-500/30">
                                        Publicar Noticia
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Edición Perfil */}
                {isEditing && isOwnProfile && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-xl font-bold">Editar Perfil</h3>
                                <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
                            </div>
                            <form onSubmit={handleSave} className="p-6 space-y-4">
                                <div className="flex justify-center mb-6">
                                    <div className="relative h-24 w-24">
                                        <div className={`h-24 w-24 rounded-full overflow-hidden border-2 border-gray-200 ${profileUser.marco && profileUser.marco !== 'ninguno' ? `frame-${profileUser.marco} scale-95` : ''}`}>
                                            {previewImage ? <img src={previewImage} alt="Preview" className="h-full w-full object-cover" /> : profileUser.foto ? <img src={profileUser.foto} className="h-full w-full object-cover" /> : <div className="bg-gray-100 h-full w-full flex items-center justify-center"><User /></div>}
                                        </div>
                                        <label className="absolute bottom-0 right-0 bg-brand-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-brand-700 shadow-sm">
                                            <Camera className="h-4 w-4" /><input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                        </label>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Nombre" name="first_name" value={formData.first_name} onChange={handleInputChange} />
                                    <Input label="Apellidos" name="last_name" value={formData.last_name} onChange={handleInputChange} />
                                </div>
                                <Input label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
                                <div className="pt-4 flex gap-3"><Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>Cancelar</Button><Button type="submit" className="flex-1" disabled={saveLoading}>{saveLoading ? 'Guardando...' : 'Guardar'}</Button></div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modales de Actividades */}
                {isOwnProfile && isActivityModalOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                <h3 className="text-xl font-bold">{editingActivity ? 'Editar Actividad' : 'Crear Actividad'}</h3>
                                <button onClick={() => setIsActivityModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
                            </div>
                            <form onSubmit={handleSaveActivity} className="p-6 space-y-4">
                                <Input label="Título" name="titulo" value={activityForm.titulo} onChange={handleActivityInputChange} required />
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Descripción</label>
                                    <textarea name="descripcion" value={activityForm.descripcion} onChange={handleActivityInputChange} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500" rows="3" required></textarea>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Requerimientos (uno por línea)</label>
                                    <textarea 
                                        name="requerimientos" 
                                        value={activityForm.requerimientos} 
                                        onChange={handleActivityInputChange} 
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500" 
                                        rows="3" 
                                        placeholder="Ej: Traer ropa cómoda&#10;Ser mayor de edad&#10;Traer guantes de trabajo"
                                    ></textarea>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Fecha" name="fecha_evento" type="datetime-local" value={activityForm.fecha_evento} onChange={handleActivityInputChange} required />
                                    <Input label="Cupo" name="cupo_maximo" type="number" min="0" value={activityForm.cupo_maximo} onChange={handleActivityInputChange} required />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1"><label className="text-sm font-medium text-gray-700">Estado</label><select name="estado" value={activityForm.estado} onChange={handleActivityInputChange} className="w-full border-gray-300 rounded-md shadow-sm"><option value="borrador">Borrador</option><option value="publicado">Publicado</option><option value="finalizado">Finalizado</option></select></div>
                                    <div className="space-y-1"><label className="text-sm font-medium text-gray-700">Etiqueta</label><select name="etiqueta" value={activityForm.etiqueta} onChange={handleActivityInputChange} className="w-full border-gray-300 rounded-md shadow-sm"><option value="medio_ambiente">Medio Ambiente</option><option value="educacion">Educación</option><option value="salud">Salud</option><option value="comunidad">Comunidad</option><option value="animales">Animales</option><option value="otros">Otros</option></select></div>
                                    <div className="space-y-1"><label className="text-sm font-medium text-gray-700">Pedanía</label><select name="pedanias" value={activityForm.pedanias} onChange={handleActivityInputChange} className="w-full border-gray-300 rounded-md shadow-sm" required><option value="">Selecciona...</option>{pedanias.map(p => (<option key={p.id} value={p.id}>{p.nombre}</option>))}</select></div>
                                </div>
                                <div className="pt-4 flex gap-3"><Button type="button" variant="outline" className="flex-1" onClick={() => setIsActivityModalOpen(false)}>Cancelar</Button><Button type="submit" className="flex-1">Guardar</Button></div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal de Borrado */}
                {activityToDelete && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-center">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6"><Trash2 className="h-8 w-8 text-red-600" /></div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">¿Eliminar actividad?</h3>
                            <p className="text-gray-500 mb-8">Esta acción no se puede deshacer.</p>
                            <div className="flex gap-4">
                                <Button variant="outline" className="flex-1" onClick={() => setActivityToDelete(null)}>Cancelar</Button>
                                <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={confirmDeleteActivity}>Sí, eliminar</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}

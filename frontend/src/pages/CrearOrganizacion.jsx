import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layouts/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';

export default function CrearOrganizacion() {
    // Definicion de estados para los datos del formulario de la entidad
    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nombreEntidad, setNombreEntidad] = useState('');
    
    // Estados para el manejo de errores y mensajes de exito en la peticion
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const { user } = useAuth();
    const navigate = useNavigate();

    // Comprobacion de seguridad basica de administrador
    const isAdmin = user && 
                    user.rol && 
                    user.rol.toLowerCase() === 'administrador';

    // Declaracion de la funcion para manejar el evento de enviar este formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Preparacion del objeto con los datos introducidos por teclado
        const data = {
            username: username,
            first_name: firstName,
            last_name: lastName,
            email: email,
            password: password,
            nombre_entidad: nombreEntidad
        };

        try {
            // Se realiza la peticion POST al servidor local especificando la ruta
            const response = await axiosInstance.post('crear-organizacion/', data);
            
            // Si la operacion fue exitosa, guardamos el mensaje para notificarlo
            setSuccess(response.data.mensaje || 'Organización creada exitosamente.');

            // Vaciamos los inputs reseteando el estado del componente
            setUsername('');
            setFirstName('');
            setLastName('');
            setEmail('');
            setPassword('');
            setNombreEntidad('');

            // Redireccion a la pagina principal pasados unos segundos
            setTimeout(() => {
                navigate('/');
            }, 3000);
            
        } catch (err) {
            // Tratamiento del error que devuelve la api e impresion del mismo en pantalla
            console.error('Error al crear la organización:', err);
            const errorMessage = err.response && err.response.data && err.response.data.error 
                                 ? err.response.data.error 
                                 : 'Hubo un error al crear la organización. Comprueba los datos introducidos.';
            setError(errorMessage);
        }
    };

    // Si el usuario no es un administrador, le restringimos la vista y el acceso
    if (!isAdmin) {
        return (
            <Layout>
                <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg text-center">
                        <h2 className="text-2xl font-bold text-red-600">Acceso Denegado</h2>
                        <p className="text-gray-600">Solo los administradores pueden acceder a esta función.</p>
                        <Button onClick={() => navigate('/')} className="mt-4">Volver al inicio</Button>
                    </div>
                </div>
            </Layout>
        );
    }

    // Renderizado del HTML del formulario para el alta de las nuevas organizaciones
    return (
        <Layout>
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
                <div className="max-w-2xl w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
                    <div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                            Crear Nueva Organización
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Complete los datos para generar un usuario con perfil de organización.
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Nombre de Usuario"
                                id="username"
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="usuario_org"
                            />
                            <Input
                                label="Correo Electrónico"
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="correo@organizacion.com"
                            />
                            <Input
                                label="Nombre del Contacto"
                                id="firstName"
                                type="text"
                                required
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="Nombre"
                            />
                            <Input
                                label="Apellidos del Contacto"
                                id="lastName"
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Appelidos"
                            />
                            <Input
                                label="Nombre de la Entidad"
                                id="nombreEntidad"
                                type="text"
                                required
                                value={nombreEntidad}
                                onChange={(e) => setNombreEntidad(e.target.value)}
                                placeholder="Ej: Cruz Roja"
                            />
                            <Input
                                label="Contraseña Inicial"
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="********"
                            />
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded border border-red-200">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="text-green-600 text-sm text-center bg-green-50 p-2 rounded border border-green-200">
                                {success}
                            </div>
                        )}

                        <div>
                            <Button type="submit" className="w-full" size="lg">
                                Registrar Organización
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}

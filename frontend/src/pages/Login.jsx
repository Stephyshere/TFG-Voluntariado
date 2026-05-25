import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../layouts/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail } from 'lucide-react';


// Componente de la pagina de login para que los usuarios puedan iniciar sesión. --ESTEFANIA
export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    // Función para manejar el envío del formulario de login --ESTEFANIA
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const result = await login(username, password);
            if (result.success) {
                navigate('/'); // Redirige a la página de inicio después de un login exitoso
            } else {
                setError(result.error || 'Error al iniciar sesión. Comprueba tus datos.');
            }
        } catch (err) {
            console.error(err);
            setError('Error de conexión. Asegúrate de que el servidor backend está encendido.');
        }
    };

    // Renderiza el formulario de login con campos para usuario y contraseña, y muestra errores si los hay. --ESTEFANIA
    return (
        <Layout>
            <div
                className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('https://www.guiarepsol.com/content/dam/repsol-guia/contenidos-imagenes/viajar/vamos-de-excursion/mazarron-region-murcia-que-ver-hacer/gr-cms-media-featured_images-none-67048cbf-f294-4cb0-9549-f5784b87e624-11-cala-bahia-2.jpg')`
                }}
            >
                <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
                    <div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900"> 
                            Inicia Sesión
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            ¿No tienes una cuenta?{' '} 
                            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                                Regístrate gratis
                            </Link>
                        </p>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}> 
                        <div className="space-y-4">
                            <Input
                                label="Usuario"
                                id="username"
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Nombre de usuario"
                            />
                            <div className="flex flex-col">
                                <Input
                                    label="Contraseña"
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="********"
                                />
                                <div className="mt-2 text-right">
                                    <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:text-brand-500 transition-colors">
                                        ¿Has olvidado tu contraseña?
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
                                {error}
                            </div>
                        )}

                        <div>
                            <Button type="submit" className="w-full" size="lg">
                                Entrar
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}

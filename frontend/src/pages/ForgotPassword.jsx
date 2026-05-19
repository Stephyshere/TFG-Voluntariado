import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../layouts/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import axiosInstance from '../api/axiosInstance';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            const response = await axiosInstance.post('password-reset/', { email });
            setMessage(response.data.mensaje);
            setEmail('');
        } catch (err) {
            setError(err.response?.data?.error || 'Error al enviar la solicitud. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
                <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
                    <div className="text-center">
                        <div className="mx-auto h-12 w-12 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-4">
                            <Mail className="h-6 w-6" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900">
                            Recuperar contraseña
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Introduce tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                        </p>
                    </div>
                    
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <Input
                                label="Correo electrónico"
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@email.com"
                            />
                        </div>

                        {message && (
                            <div className="text-sm text-center bg-green-50 text-green-700 p-3 rounded-lg border border-green-200">
                                {message}
                            </div>
                        )}
                        
                        {error && (
                            <div className="text-sm text-center bg-red-50 text-red-600 p-3 rounded-lg border border-red-200">
                                {error}
                            </div>
                        )}

                        <div>
                            <Button type="submit" className="w-full" size="lg" disabled={loading}>
                                {loading ? 'Enviando...' : 'Enviar enlace'}
                            </Button>
                        </div>
                        
                        <div className="text-center mt-4">
                            <Link to="/login" className="inline-flex items-center text-sm font-medium text-brand-600 hover:text-brand-500 transition-colors">
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                Volver al inicio de sesión
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}

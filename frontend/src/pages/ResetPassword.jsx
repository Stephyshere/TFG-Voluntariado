import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../layouts/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import axiosInstance from '../api/axiosInstance';
import { Lock, ArrowRight } from 'lucide-react';

export default function ResetPassword() {
    const { uidb64, token } = useParams();
    const navigate = useNavigate();
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        if (password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres.');
            return;
        }

        setLoading(true);

        try {
            const response = await axiosInstance.post('password-reset-confirm/', { 
                uidb64, 
                token, 
                password 
            });
            setMessage(response.data.mensaje);
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al restablecer la contraseña. El enlace puede haber expirado.');
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
                            <Lock className="h-6 w-6" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900">
                            Crear nueva contraseña
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Introduce tu nueva contraseña a continuación.
                        </p>
                    </div>
                    
                    {success ? (
                        <div className="mt-8 text-center space-y-6">
                            <div className="text-sm text-center bg-green-50 text-green-700 p-4 rounded-lg border border-green-200 font-medium">
                                {message}
                            </div>
                            <Link to="/login" className="inline-block w-full">
                                <Button className="w-full flex justify-center items-center gap-2" size="lg">
                                    Ir a iniciar sesión <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <Input
                                    label="Nueva contraseña"
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="********"
                                />
                                <Input
                                    label="Confirmar nueva contraseña"
                                    id="confirmPassword"
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="********"
                                />
                            </div>

                            {error && (
                                <div className="text-sm text-center bg-red-50 text-red-600 p-3 rounded-lg border border-red-200">
                                    {error}
                                </div>
                            )}

                            <div>
                                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                                    {loading ? 'Guardando...' : 'Guardar contraseña'}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </Layout>
    );
}

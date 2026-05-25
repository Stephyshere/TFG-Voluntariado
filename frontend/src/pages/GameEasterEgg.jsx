import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { 
    Heart, 
    Trophy, 
    Sparkles, 
    Clock, 
    ArrowLeft, 
    Play, 
    RotateCcw, 
    FileDown, 
    ShieldAlert, 
    Star 
} from 'lucide-react';

/**
 * Representa un objeto físico en memoria dentro del motor de física del canvas.
 * @typedef {Object} PhysicsObject
 * @property {number} id - Identificador del objeto.
 * @property {number} x - Posición X en píxeles.
 * @property {number} y - Posición Y en píxeles.
 * @property {string} type - Tipo de objeto ('heart' | 'star' | 'bug').
 * @property {number} speed - Velocidad de caída por frame.
 * @property {number} size - Tamaño físico del objeto.
 */

/**
 * Representa un texto flotante temporal dibujado sobre el canvas.
 * @typedef {Object} CanvasFloatingText
 * @property {number} id - Identificador.
 * @property {number} x - Posición X en píxeles.
 * @property {number} y - Posición Y en píxeles.
 * @property {string} text - Contenido de texto.
 * @property {string} color - Color hexadecimal de renderizado.
 * @property {number} opacity - Nivel de opacidad (1.0 a 0.0).
 */

/**
 * Componente de la página del Easter Egg del minijuego "Caza de Corazones".
 * Implementa renderizado gráfico de alto rendimiento sobre Canvas HTML5 2D para eliminar la
 * reconciliación pesada de DOM virtual, garantizando 60 FPS estables en cualquier dispositivo.
 * 
 * @returns {React.ReactElement} El elemento JSX del minijuego con Canvas 2D.
 */
export default function GameEasterEgg() {
    const navigate = useNavigate();

    // Estados de React exclusivamente para el control de la UI periférica (marcador, vidas, pantallas)
    const [gameState, setGameState] = useState('welcome'); // 'welcome' | 'playing' | 'gameover' | 'finished'
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [timeLeft, setTimeLeft] = useState(30);
    const [evaluatorName, setEvaluatorName] = useState('');
    const [pdfDownloaded, setPdfDownloaded] = useState(false);

    // Referencias para el renderizado síncrono del Canvas
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    
    // Referencias de control físicas mutables (evitan re-renderizados masivos)
    const scoreRef = useRef(0);
    const livesRef = useRef(3);
    const playerXRef = useRef(320); // Posición X inicial en píxeles
    const objectsRef = useRef([]); // Colección de objetos cayendo en memoria
    const floatingTextsRef = useRef([]); // Colección de textos en memoria
    
    const requestRef = useRef(null);
    const lastSpawnTimeRef = useRef(0);
    const timerIntervalRef = useRef(null);

    // Dimensiones constantes de diseño del juego
    const canvasWidth = 640;
    const canvasHeight = 480;
    const playerWidth = 100;
    const playerHeight = 15;
    const playerY = canvasHeight - 40; // Altura fija de la cesta en píxeles

    /**
     * Dibuja una forma de corazón vectorial elegante en el contexto del canvas.
     * 
     * @param {CanvasRenderingContext2D} ctx - Contexto 2D del Canvas.
     * @param {number} x - Centro en eje X.
     * @param {number} y - Centro en eje Y.
     * @param {number} size - Tamaño físico.
     * @returns {void}
     */
    const drawHeart = (ctx, x, y, size) => {
        ctx.beginPath();
        ctx.moveTo(x, y - size / 4);
        ctx.bezierCurveTo(x, y - size / 2, x - size / 2, y - size / 2, x - size / 2, y - size / 4);
        ctx.bezierCurveTo(x - size / 2, y + size / 8, x, y + size / 2, x, y + size * 0.7);
        ctx.bezierCurveTo(x, y + size / 2, x + size / 2, y + size / 8, x + size / 2, y - size / 4);
        ctx.bezierCurveTo(x + size / 2, y - size / 2, x, y - size / 2, x, y - size / 4);
        ctx.closePath();
        ctx.fill();
    };

    /**
     * Dibuja una estrella geométrica brillante de 5 puntas en el canvas.
     * 
     * @param {CanvasRenderingContext2D} ctx - Contexto 2D del Canvas.
     * @param {number} x - Centro en X.
     * @param {number} y - Centro en Y.
     * @param {number} spikes - Número de puntas.
     * @param {number} outerRadius - Radio externo.
     * @param {number} innerRadius - Radio interno.
     * @returns {void}
     */
    const drawStar = (ctx, x, y, spikes, outerRadius, innerRadius) => {
        let rot = (Math.PI / 2) * 3;
        let cx = x;
        let cy = y;
        const step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            cx = x + Math.cos(rot) * outerRadius;
            cy = y + Math.sin(rot) * outerRadius;
            ctx.lineTo(cx, cy);
            rot += step;

            cx = x + Math.cos(rot) * innerRadius;
            cy = y + Math.sin(rot) * innerRadius;
            ctx.lineTo(cx, cy);
            rot += step;
        }
        ctx.lineTo(x, y - outerRadius);
        ctx.closePath();
        ctx.fill();
    };

    /**
     * Dibuja un insecto vectorial estilizado (representando bugs del sistema) en el canvas.
     * 
     * @param {CanvasRenderingContext2D} ctx - Contexto 2D del Canvas.
     * @param {number} x - Centro X.
     * @param {number} y - Centro Y.
     * @param {number} size - Tamaño físico.
     * @returns {void}
     */
    const drawBug = (ctx, x, y, size) => {
        // Cuerpo principal
        ctx.beginPath();
        ctx.arc(x, y, size / 3, 0, Math.PI * 2);
        ctx.fillStyle = '#fb7185'; // Rosa brillante de Tailwind
        ctx.fill();
        ctx.closePath();

        // Cabeza
        ctx.beginPath();
        ctx.arc(x, y - size / 3, size / 6, 0, Math.PI * 2);
        ctx.fillStyle = '#f43f5e'; // Carmín
        ctx.fill();
        ctx.closePath();

        // Ojos
        ctx.beginPath();
        ctx.arc(x - size / 12, y - size / 3, 1.5, 0, Math.PI * 2);
        ctx.arc(x + size / 12, y - size / 3, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.closePath();

        // Patas laterales
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2.5;
        for (let i = -1; i <= 1; i += 2) {
            // Pata superior
            ctx.beginPath();
            ctx.moveTo(x + i * (size / 3), y - size / 12);
            ctx.lineTo(x + i * (size / 1.8), y - size / 4);
            ctx.stroke();

            // Pata central
            ctx.beginPath();
            ctx.moveTo(x + i * (size / 3), y + size / 12);
            ctx.lineTo(x + i * (size / 1.6), y + size / 12);
            ctx.stroke();

            // Pata inferior
            ctx.beginPath();
            ctx.moveTo(x + i * (size / 3), y + size / 4);
            ctx.lineTo(x + i * (size / 1.8), y + size / 2);
            ctx.stroke();
        }

        // Antenas
        ctx.beginPath();
        ctx.moveTo(x - size / 12, y - size / 2);
        ctx.quadraticCurveTo(x - size / 6, y - size * 0.7, x - size / 4, y - size * 0.75);
        ctx.moveTo(x + size / 12, y - size / 2);
        ctx.quadraticCurveTo(x + size / 6, y - size * 0.7, x + size / 4, y - size * 0.75);
        ctx.stroke();
    };

    /**
     * Registra un efecto de texto flotante en la memoria del juego.
     * 
     * @param {number} x - Posición X en píxeles.
     * @param {number} y - Posición Y en píxeles.
     * @param {string} text - Contenido textual.
     * @param {string} color - Color hexadecimal.
     * @returns {void}
     */
    const addFloatingText = (x, y, text, color) => {
        floatingTextsRef.current.push({
            id: Date.now() + Math.random(),
            x,
            y,
            text,
            color,
            opacity: 1.0
        });
    };

    /**
     * Mueve la cesta horizontalmente al desplazar el ratón sobre el canvas de forma síncrona.
     * 
     * @param {React.MouseEvent<HTMLCanvasElement>} e - Evento de ratón de React.
     * @returns {void}
     */
    const handleMouseMove = (e) => {
        if (gameState !== 'playing' || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        
        // Calcular la escala entre la resolución real del canvas (640) y su tamaño visual CSS en pantalla
        const scaleX = canvasWidth / rect.width;
        const offsetX = (e.clientX - rect.left) * scaleX;
        
        // Limitar la posición dentro de los límites laterales del canvas
        let newX = offsetX;
        if (newX < playerWidth / 2) newX = playerWidth / 2;
        if (newX > canvasWidth - playerWidth / 2) newX = canvasWidth - playerWidth / 2;
        
        playerXRef.current = newX;
    };

    /**
     * Permite controlar la cesta horizontalmente con las teclas A/D y Flechas.
     * 
     * @param {KeyboardEvent} e - Evento nativo de teclado.
     * @returns {void}
     */
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (gameState !== 'playing') return;
            const step = 35; // Paso de desplazamiento por pulsación en píxeles
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                playerXRef.current = Math.max(playerWidth / 2, playerXRef.current - step);
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                playerXRef.current = Math.min(canvasWidth - playerWidth / 2, playerXRef.current + step);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState]);

    /**
     * Inicializa los marcadores, vacía buffers de memoria y arranca el loop del Canvas y el reloj.
     * 
     * @returns {void}
     */
    const startGame = () => {
        setScore(0);
        setLives(3);
        setTimeLeft(30);
        
        scoreRef.current = 0;
        livesRef.current = 3;
        playerXRef.current = canvasWidth / 2;
        objectsRef.current = [];
        floatingTextsRef.current = [];
        lastSpawnTimeRef.current = Date.now();
        setPdfDownloaded(false);
        setGameState('playing');
    };

    /**
     * Detiene los ciclos activos de temporizadores e hilos de animación del Canvas.
     * 
     * @returns {void}
     */
    const stopGame = () => {
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
            requestRef.current = null;
        }
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
    };

    // Temporizador síncrono del reloj (1 segundo)
    useEffect(() => {
        if (gameState === 'playing') {
            timerIntervalRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        setGameState('finished');
                        stopGame();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, [gameState]);

    // Bucle físico y gráfico de alto rendimiento sobre Canvas HTML5
    useEffect(() => {
        if (gameState !== 'playing') return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        /**
         * Ciclo de actualización física e instrucción de redibujo gráfico instantáneo a 60 FPS estables.
         * Realiza el limpiado de buffer, dibuja la cesta, los elementos cayendo y calcula colisiones.
         */
        const renderLoop = () => {
            const now = Date.now();

            // 1. Limpieza de pantalla con fondo azul noche oscuro
            ctx.fillStyle = '#0f172a'; // Slate-900
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            // Dibujar rejilla retro decorativa
            ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
            ctx.lineWidth = 1;
            const gridSpacing = 40;
            for (let x = 0; x < canvasWidth; x += gridSpacing) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvasHeight);
                ctx.stroke();
            }
            for (let y = 0; y < canvasHeight; y += gridSpacing) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvasWidth, y);
                ctx.stroke();
            }

            // 2. Generación programada de causas o bugs (cada 600 ms para más dinamismo)
            if (now - lastSpawnTimeRef.current > 600) {
                const rand = Math.random();
                let type = 'heart';
                let speed = 2.5 + Math.random() * 2.0; // Velocidad de caída adaptada en píxeles

                if (rand > 0.82) {
                    type = 'star'; // Súper causa
                    speed = 4.0 + Math.random() * 2.0;
                } else if (rand > 0.68) {
                    type = 'bug'; // Bug / Incidencia
                    speed = 2.0 + Math.random() * 1.5;
                }

                objectsRef.current.push({
                    id: now + Math.random(),
                    x: 30 + Math.random() * (canvasWidth - 60),
                    y: -20,
                    type,
                    speed,
                    size: type === 'star' ? 24 : 20
                });

                lastSpawnTimeRef.current = now;
            }

            // 3. Procesar colisiones y caída de objetos físicos en memoria
            const activeObjects = [];
            for (let i = 0; i < objectsRef.current.length; i++) {
                const obj = objectsRef.current[i];
                obj.y += obj.speed;

                // Cálculo geométrico de colisión (bounding box de la cesta colectora)
                const withinY = obj.y + obj.size / 2 >= playerY && obj.y - obj.size / 2 <= playerY + playerHeight;
                const withinX = Math.abs(obj.x - playerXRef.current) <= (playerWidth / 2 + obj.size / 2);

                if (withinY && withinX) {
                    // Colisión detectada: disparar efectos y actualizar estados reactivos periféricos
                    if (obj.type === 'heart') {
                        scoreRef.current += 10;
                        setScore(scoreRef.current);
                        addFloatingText(obj.x, obj.y, '+10 Puntos', '#34d399');
                    } else if (obj.type === 'star') {
                        scoreRef.current += 25;
                        setScore(scoreRef.current);
                        addFloatingText(obj.x, obj.y, '+25 Súper Causa', '#facc15');
                    } else if (obj.type === 'bug') {
                        scoreRef.current = Math.max(0, scoreRef.current - 15);
                        setScore(scoreRef.current);
                        addFloatingText(obj.x, obj.y, '-15 Incidencia', '#fb7185');
                        
                        livesRef.current -= 1;
                        setLives(livesRef.current);
                        if (livesRef.current <= 0) {
                            setGameState('gameover');
                            stopGame();
                            return;
                        }
                    }
                    continue; // Descarta el objeto (se elimina)
                }

                // Conservar solo si no cae fuera del límite inferior del lienzo
                if (obj.y < canvasHeight + 20) {
                    activeObjects.push(obj);
                }
            }
            objectsRef.current = activeObjects;

            // 4. Dibujar los objetos de juego en el canvas
            for (let i = 0; i < objectsRef.current.length; i++) {
                const obj = objectsRef.current[i];
                if (obj.type === 'heart') {
                    ctx.fillStyle = '#34d399'; // Esmeralda
                    drawHeart(ctx, obj.x, obj.y, obj.size);
                } else if (obj.type === 'star') {
                    ctx.fillStyle = '#facc15'; // Oro
                    drawStar(ctx, obj.x, obj.y, 5, obj.size / 2, obj.size / 4);
                } else if (obj.type === 'bug') {
                    drawBug(ctx, obj.x, obj.y, obj.size);
                }
            }

            // 5. Actualizar y dibujar textos flotantes en el lienzo
            const activeTexts = [];
            for (let i = 0; i < floatingTextsRef.current.length; i++) {
                const textObj = floatingTextsRef.current[i];
                textObj.y -= 1.2; // Desplazamiento ascendente
                textObj.opacity -= 0.02; // Desvanecimiento gradual

                if (textObj.opacity > 0) {
                    ctx.save();
                    ctx.globalAlpha = textObj.opacity;
                    ctx.fillStyle = textObj.color;
                    ctx.font = 'bold 13px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(textObj.text, textObj.x, textObj.y);
                    ctx.restore();
                    activeTexts.push(textObj);
                }
            }
            floatingTextsRef.current = activeTexts;

            // 6. Dibujar la cesta del jugador
            ctx.save();
            // Efecto de sombreado y neón brillante alrededor de la cesta
            ctx.shadowColor = '#8b5cf6';
            ctx.shadowBlur = 15;

            // Crear gradiente lineal para pintar la cesta colectora
            const gradient = ctx.createLinearGradient(
                playerXRef.current - playerWidth / 2, 
                playerY, 
                playerXRef.current + playerWidth / 2, 
                playerY
            );
            gradient.addColorStop(0, '#3b82f6'); // Azul
            gradient.addColorStop(1, '#8b5cf6'); // Violeta

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(playerXRef.current - playerWidth / 2, playerY, playerWidth, playerHeight, 8);
            ctx.fill();
            ctx.closePath();
            ctx.restore();

            // Dibujar la moldura blanca decorativa interna de la cesta
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.roundRect(playerXRef.current - playerWidth / 3, playerY + 3, (playerWidth * 2) / 3, 3, 2);
            ctx.fill();
            ctx.closePath();

            requestRef.current = requestAnimationFrame(renderLoop);
        };

        requestRef.current = requestAnimationFrame(renderLoop);
        return () => stopGame();
    }, [gameState]);

    /**
     * Genera y descarga el diploma de Matrícula de Honor en PDF mediante jsPDF.
     * Incorpora controles robustos y captura específica de excepciones de inicialización.
     * 
     * @returns {void}
     */
    const downloadDiploma = () => {
        if (!evaluatorName.trim()) return;

        try {
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const pageHeight = doc.internal.pageSize.getHeight();
            const pageWidth = doc.internal.pageSize.getWidth();

            // Dibujar marcos estéticos dobles en el certificado (azul marino y dorado)
            doc.setDrawColor(30, 41, 59); // Azul pizarra oscuro
            doc.setLineWidth(1.5);
            doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

            doc.setDrawColor(202, 138, 4); // Dorado oscuro
            doc.setLineWidth(0.5);
            doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

            // Encabezado institucional
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(20);
            doc.setTextColor(30, 41, 59);
            doc.text('INSTITUTO SUPERIOR DE VOLUNTARIADO DE MAZARRÓN', pageWidth / 2, 35, { align: 'center' });

            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(11);
            doc.setTextColor(100, 116, 139);
            doc.text('TRIBUNAL DE EVALUACIÓN EXTRAOFICIAL Y RELAJACIÓN DEL TFG', pageWidth / 2, 42, { align: 'center' });

            // Divisor estético elegante
            doc.setDrawColor(202, 138, 4);
            doc.setLineWidth(0.8);
            doc.line(pageWidth / 2 - 40, 48, pageWidth / 2 + 40, 48);

            // Título
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(26);
            doc.setTextColor(202, 138, 4);
            doc.text('CERTIFICADO DE EXCELENCIA ACADÉMICA', pageWidth / 2, 65, { align: 'center' });

            doc.setFont('Helvetica', 'italic');
            doc.setFontSize(13);
            doc.setTextColor(71, 85, 105);
            doc.text('Otorgado formalmente con la calificación de Matrícula de Honor a:', pageWidth / 2, 77, { align: 'center' });

            // Nombre del galardonado
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(22);
            doc.setTextColor(15, 23, 42);
            doc.text(evaluatorName.toUpperCase(), pageWidth / 2, 92, { align: 'center' });

            // Subrayado del nombre
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.4);
            doc.line(pageWidth / 2 - 60, 96, pageWidth / 2 + 60, 96);

            // Cuerpo del texto del diploma
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(12);
            doc.setTextColor(51, 65, 85);
            const textLines = [
                'Por haber superado con éxito las pruebas físicas del lienzo virtual de control de colisiones,',
                `logrando rescatar de forma impecable un total de ${score} causas sociales de voluntariado`,
                'y mitigando los bugs e incidencias de software de forma síncrona en tiempo real.',
                'En testimonio de su gran talante y excelencia durante el período de evaluación del TFG.'
            ];
            
            let currentY = 110;
            textLines.forEach((line) => {
                doc.text(line, pageWidth / 2, currentY, { align: 'center' });
                currentY += 7;
            });

            // Ubicación y Fecha del otorgamiento
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139);
            const fechaText = 'Dado en el Puerto de Mazarrón, a 25 de Mayo de 2026.';
            doc.text(fechaText, pageWidth / 2, 148, { align: 'center' });

            // Sección de firmas
            doc.setDrawColor(203, 213, 225);
            doc.setLineWidth(0.3);
            
            // Firma de Estefanía
            doc.line(45, 172, 105, 172);
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(51, 65, 85);
            doc.text('Estefanía', 75, 177, { align: 'center' });
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(148, 163, 184);
            doc.text('Coautora del Proyecto', 75, 181, { align: 'center' });

            // Firma de Rubén
            doc.line(pageWidth - 105, 172, pageWidth - 45, 172);
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(51, 65, 85);
            doc.text('Rubén', pageWidth - 75, 177, { align: 'center' });
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(148, 163, 184);
            doc.text('Coautor del Proyecto', pageWidth - 75, 181, { align: 'center' });

            doc.save('Diploma_Honorifico_TFG_Mazarron.pdf');
            setPdfDownloaded(true);
        } catch (error) {
            console.error('Falla en la inicialización o renderizado del documento jsPDF:', error);
            alert('Fallo al generar el archivo. Por favor, inténtelo de nuevo.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-between p-6 relative overflow-hidden font-sans">
            {/* Gradientes decorativos orbitales */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl pointer-events-none"></div>

            {/* Cabecera superior */}
            <header className="w-full max-w-4xl flex items-center justify-between mb-4 z-10">
                <button 
                    onClick={() => navigate('/')} 
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-800/80 transition-all duration-300 shadow-lg cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Volver a la Plataforma</span>
                </button>
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
                    <span className="text-sm font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent uppercase tracking-wider">Módulo de Relajación TFG</span>
                </div>
            </header>

            {/* Panel central */}
            <main className="w-full max-w-2xl flex-1 flex flex-col items-center justify-center z-10 my-4">
                {/* 1. Vista de Bienvenida */}
                {gameState === 'welcome' && (
                    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
                        <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/10">
                            <Trophy className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-black mb-3">Caza de Corazones</h1>
                        <p className="text-slate-400 text-base mb-6 leading-relaxed max-w-md mx-auto">
                            ¡Bienvenido al minijuego interactivo del proyecto! Ayuda a recolectar las causas de voluntariado del cielo y esquiva los errores técnicos para demostrar tus reflejos académicos.
                        </p>
                        
                        {/* Instrucciones visuales */}
                        <div className="grid grid-cols-3 gap-4 mb-8 text-left">
                            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex flex-col items-center text-center">
                                <Heart className="w-6 h-6 text-emerald-400 mb-2" />
                                <span className="text-xs text-slate-500 block mb-1">Voluntariado</span>
                                <span className="text-sm font-black text-emerald-400">+10 Puntos</span>
                            </div>
                            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex flex-col items-center text-center">
                                <Star className="w-6 h-6 text-yellow-400 mb-2 animate-bounce" />
                                <span className="text-xs text-slate-500 block mb-1">Súper Causa</span>
                                <span className="text-sm font-black text-yellow-400">+25 Puntos</span>
                            </div>
                            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex flex-col items-center text-center">
                                <span className="w-6 h-6 border-2 border-rose-500 rounded-full flex items-center justify-center text-[10px] text-rose-500 font-extrabold mb-2">BUG</span>
                                <span className="text-xs text-slate-500 block mb-1">Incidencia</span>
                                <span className="text-sm font-black text-rose-400">-15 Puntos</span>
                            </div>
                        </div>

                        <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/50 mb-8 max-w-sm mx-auto">
                            <p className="text-xs text-slate-400 leading-normal">
                                Mueve tu cursor horizontalmente por el área de juego para guiar la cesta colectora. Supera los 100 puntos en 30 segundos para desbloquear el diploma honorífico.
                            </p>
                        </div>

                        <button 
                            onClick={startGame}
                            className="w-full max-w-xs py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-lg transition-all duration-300 shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40 hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2 mx-auto"
                        >
                            <Play className="w-5 h-5 fill-current" />
                            <span>Comenzar a Jugar</span>
                        </button>
                    </div>
                )}

                {/* 2. Vista del Juego con Canvas HTML5 */}
                {gameState === 'playing' && (
                    <div className="w-full flex flex-col">
                        {/* Marcador periférico en React */}
                        <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-2xl px-6 py-4 mb-4 shadow-lg">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Puntuación:</span>
                                <span className="text-2xl font-black text-white">{score}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
                                    <Clock className="w-4 h-4 text-purple-400" />
                                    <span className="text-sm font-black font-mono text-purple-300">{timeLeft}s</span>
                                </div>
                                <div className="flex gap-1">
                                    {Array.from({ length: 3 }).map((_, index) => (
                                        <Heart 
                                            key={index} 
                                            className={`w-6 h-6 transition-all duration-300 ${
                                                index < lives 
                                                    ? 'text-rose-500 fill-current drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]' 
                                                    : 'text-slate-800'
                                            }`} 
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Contenedor del Lienzo del Canvas */}
                        <div 
                            ref={containerRef}
                            className="w-full bg-slate-900 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative"
                        >
                            <canvas 
                                ref={canvasRef}
                                width={canvasWidth}
                                height={canvasHeight}
                                onMouseMove={handleMouseMove}
                                className="w-full h-auto max-h-[500px] block cursor-none"
                            />
                        </div>
                    </div>
                )}

                {/* 3. Vista de Partida Terminada (Game Over) */}
                {gameState === 'gameover' && (
                    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
                        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <ShieldAlert className="w-8 h-8 text-rose-400" />
                        </div>
                        <h2 className="text-3xl font-black text-rose-400 mb-2">Partida Incompleta</h2>
                        <p className="text-slate-400 text-base mb-6 leading-relaxed max-w-sm mx-auto">
                            El sistema ha alcanzado el límite crítico de incidencias técnicas en el código antes de finalizar el tiempo del voluntariado.
                        </p>
                        
                        <div className="bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 mb-8 max-w-xs mx-auto flex items-center justify-between">
                            <span className="text-sm text-slate-500 font-bold uppercase">Puntuación Final:</span>
                            <span className="text-2xl font-black text-white">{score}</span>
                        </div>

                        <button 
                            onClick={startGame}
                            className="w-full max-w-xs py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-base transition-all duration-300 shadow-md border border-slate-700 flex items-center justify-center gap-2 mx-auto cursor-pointer"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span>Reintentar de Nuevo</span>
                        </button>
                    </div>
                )}

                {/* 4. Vista de Éxito / Resultados */}
                {gameState === 'finished' && (
                    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
                        <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Trophy className="w-8 h-8 text-yellow-400" />
                        </div>
                        <h2 className="text-3xl font-black mb-2">¡Tiempo Completado!</h2>
                        <p className="text-slate-400 text-base mb-6 max-w-md mx-auto">
                            Has gestionado exitosamente el período de voluntariado de pruebas esquivando bugs académicos con maestría.
                        </p>

                        <div className="bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 mb-8 max-w-xs mx-auto flex items-center justify-between">
                            <span className="text-sm text-slate-500 font-bold uppercase">Puntos Recolectados:</span>
                            <span className="text-2xl font-black text-yellow-400">{score}</span>
                        </div>

                        {score >= 100 ? (
                            <div className="bg-slate-950/80 border border-blue-900/50 rounded-2xl p-6 mb-8 text-left max-w-md mx-auto">
                                <h3 className="text-sm font-extrabold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4 text-blue-400" />
                                    <span>¡Diploma Desbloqueado!</span>
                                </h3>
                                <p className="text-xs text-slate-400 leading-normal mb-4">
                                    ¡Felicidades! Has superado la barrera de los 100 puntos y te has hecho acreedor de un Diploma Académico Honorífico de Matrícula de Honor en Evaluación. Por favor, escribe tu nombre completo abajo para descargarlo.
                                </p>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block mb-1">Nombre Completo del Evaluador</label>
                                        <input 
                                            type="text"
                                            value={evaluatorName}
                                            onChange={(e) => setEvaluatorName(e.target.value)}
                                            placeholder="Introduce tu nombre y apellidos"
                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                    <button
                                        onClick={downloadDiploma}
                                        disabled={!evaluatorName.trim()}
                                        className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-extrabold text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/10"
                                    >
                                        <FileDown className="w-4 h-4" />
                                        <span>{pdfDownloaded ? 'Descargar de Nuevo' : 'Descargar Diploma en PDF'}</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 mb-8 text-center max-w-sm mx-auto">
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Te has quedado a las puertas de desbloquear tu diploma. Necesitas conseguir un mínimo de 100 puntos en tu contador. ¡Pruébalo otra vez!
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-xs sm:max-w-md mx-auto">
                            <button 
                                onClick={startGame}
                                className="flex-1 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all duration-300 border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span>Volver a Jugar</span>
                            </button>
                            <button 
                                onClick={() => navigate('/')}
                                className="flex-1 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-sm transition-all duration-300 border border-slate-800 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <span>Salir al Menú</span>
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer de juego */}
            <footer className="w-full text-center py-2 z-10 text-[10px] text-slate-600 tracking-wider uppercase select-none">
                Desarrollado con fines de alivio académico &copy; 2026. Todos los derechos reservados.
            </footer>
        </div>
    );
}

// =====================================================================
// MOTOR DE AJEDREZ: STOCKFISH INLINE (COMPATIBLE CON DOBLE CLIC DIRECTO)
// ARCHIVO: motor_pescado.js - SOLUCIÓN PARA EVITAR BLOQUEOS DE NAVEGADOR
// =====================================================================

let stockfishWorker = null;
let motorPensando = false;

// Esta función rompe el bloqueo de seguridad del navegador al abrir desde el escritorio
function inicializarMotorLocal() {
    if (!stockfishWorker) {
        try {
            // CÓDIGO MÁGICO: Descarga el motor y lo convierte en un enlace interno ficticio
            // para que el navegador no lo bloquee por abrir con doble clic.
            const urlMotor = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js';
            
            const codigoInvector = `
                importScripts('${urlMotor}');
            `;
            
            const blob = new Blob([codigoInvector], { type: 'application/javascript' });
            const blobURL = URL.createObjectURL(blob);
            
            stockfishWorker = new Worker(blobURL);
            
            // CONFIGURACIÓN DE VARIEDAD: Para que juegue diferente cada partida
            stockfishWorker.postMessage('uci');
            stockfishWorker.postMessage('setoption name UCI_LimitStrength value false');
            stockfishWorker.postMessage('setoption name Hash value 32');
            
            // Cambia el estilo de juego (agresivo o sólido) de forma aleatoria cada partida
            let estiloVariado = Math.floor(Math.random() * 40) - 20; 
            stockfishWorker.postMessage(`setoption name Contempt value ${estiloVariado}`);

            stockfishWorker.onmessage = function(event) {
                let linea = event.data;
                if (linea.startsWith('bestmove')) {
                    let partes = linea.split(' ');
                    let jugadaCompleta = partes[1];
                    
                    if (jugadaCompleta && jugadaCompleta !== '(none)') {
                        procesarJugadaMotorLocal(jugadaCompleta);
                    }
                    motorPensando = false;
                }
            };
            console.log("🦈 Pescado Inyectado y desbloqueado listo.");
        } catch (e) {
            console.error("Error crítico al burlar la seguridad:", e);
        }
    }
}

function pedirJugadaAlPescado() {
    if (typeof chess === 'undefined' || chess.game_over() || motorPensando) return;

    inicializarMotorLocal();
    motorPensando = true;

    let selectorNivel = document.getElementById('select-elo-pescado');
    let nivelValor = selectorNivel ? selectorNivel.value : "chessmaster";
    
    let profundidad = 12; 
    if (nivelValor === "principiante") profundidad = 4;
    if (nivelValor === "intermedio")  profundidad = 8;
    if (nivelValor === "avanzado")    profundidad = 12;
    if (nivelValor === "chessmaster") profundidad = 15;
    if (nivelValor === "maestro")     profundidad = 18;

    stockfishWorker.postMessage(`position fen ${chess.fen()}`);
    
    // Tiempo aleatorio de respuesta para darle más naturalidad humana
    let tiempoPensar = 400 + Math.random() * 600; 
    stockfishWorker.postMessage(`go depth ${profundidad} movetime ${tiempoPensar}`);
}

function procesarJugadaMotorLocal(jugadaCompleta) {
    let origen = jugadaCompleta.substring(0, 2);
    let destino = jugadaCompleta.substring(2, 4);
    let promocion = jugadaCompleta.length === 5 ? jugadaCompleta.substring(4, 5) : 'q';

    let movimientoEfectuado = chess.move({ from: origen, to: destino, promotion: promocion });

    if (movimientoEfectuado) {
        let sanEsp = traducirAlEspañol(movimientoEfectuado.san);
        let pasoPrevio = historialArbol[indiceHistorial].lineaMovs;
        let nuevaLinea = pasoPrevio ? pasoPrevio + " " + movimientoEfectuado.san : movimientoEfectuado.san;

        historialArbol.push({
            fen: chess.fen(),
            comentario: "🤖 Movimiento del motor local.",
            san: sanEsp,
            lineaMovs: nuevaLinea
        });
        
        indiceHistorial++;

        if (typeof redibujarTablero === 'function') redibujarTablero();
        if (typeof actualizarNavegacionYComentarios === 'function') actualizarNavegacionYComentarios();
        if (typeof controlarRelojDelTurno === 'function') controlarRelojDelTurno();
        
        document.getElementById('codigo-salida').value = `Motor: ${sanEsp}`;
        if (typeof reproducirSonidoTac === 'function') reproducirSonidoTac();

        verificarFinDePartida();
    }
}

// Inicialización automática
inicializarMotorLocal();
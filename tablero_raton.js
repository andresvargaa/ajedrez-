// =====================================================================
// CONTROL DEL TABLERO CON COORDENADAS CORREGIDAS PARA GIRO TOTAL
// ARCHIVO: tablero_raton.js - COMPLETO Y CORREGIDO
// =====================================================================

const _0xPz = {
    'r': 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg','n': 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg','b': 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg','q': 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg','k': 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg','p': 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg','P': 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg','R': 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg','N': 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg','B': 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg','Q': 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg','K': 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg'
};

const _0xAp = {
    "e4 c5": "Defensa Siciliana detectada ⚔️",
    "e4 e5 Nf3 Nc6 Bb5": "Apertura Española / Ruy López 🇪🇸",
    "e4 e5 Nf3 Nc6 Bc4": "Apertura Italiana 🇮🇹",
    "d4 d5 c4": "Gambito de Dama 👑",
    "e4 e6": "Defensa Francesa 🥖",
    "e4 c6": "Defensa Caro-Kann 🛡️"
};

let chess = new Chess();
let historialArbol = [{ fen: chess.fen(), comentario: "Modo de juego contra el Pescado Local activo.", san: "Inicio", lineaMovs: "" }];
let indiceHistorial = 0;
let tableroInvertido = false, casillaSeleccionada = null;

const tableroDiv = document.getElementById('tablero');
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function ajustarEscalaTablero() {
    const ancho = document.getElementById('slider-tamano').value;
    document.getElementById('bloque-juego').style.maxWidth = ancho + "px";
    const alto = parseInt(ancho) + 60; 
    document.getElementById('caja-comentarios').style.height = (alto - 140) + "px";
}

function reproducirSonidoTac() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = 'triangle'; osc.frequency.setValueAtTime(140, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.6, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.08);
}

function girarTablero() { tableroInvertido = !tableroInvertido; redibujarTablero(); }

function traducirAlEspañol(sanIngles) {
    return sanIngles.replace('K', 'R').replace('Q', 'D').replace('R', 'T').replace('B', 'A').replace('N', 'C');
}

function ejecutarMovimientoLogico(origen, destino) {
    let movimiento = chess.move({ from: origen, to: destino, promotion: 'q' });

    if (movimiento) {
        let sanEsp = traducirAlEspañol(movimiento.san);
        let pasoPrevio = historialArbol[indiceHistorial].lineaMovs;
        let nuevaLinea = pasoPrevio ? pasoPrevio + " " + movimiento.san : movimiento.san;

        let alertTáctica = `Jugada: ${sanEsp}`;
        let comentarioAutomático = "";

        if (chess.in_checkmate()) {
            alertTáctica += " ¡JAQUE MATE! ++";
            comentarioAutomático = "👑 Fin de la partida por Jaque Mate ++";
        } else if (chess.in_check()) {
            alertTáctica += " JAQUE +";
            comentarioAutomático = "⚠️ ¡Jaque + al rey!";
        }

        for (let clave in _0xAp) {
            if (nuevaLinea.startsWith(clave)) {
                comentarioAutomático += `\n🌟 Teoría: ${_0xAp[clave]}`;
            }
        }

        document.getElementById('codigo-salida').value = alertTáctica;

        if (indiceHistorial < historialArbol.length - 1) {
            if (historialArbol[indiceHistorial + 1].san !== sanEsp) {
                historialArbol = historialArbol.slice(0, indiceHistorial + 1);
            }
        }

        historialArbol.push({
            fen: chess.fen(),
            comentario: comentarioAutomático.trim(),
            san: sanEsp,
            lineaMovs: nuevaLinea
        });

        indiceHistorial++;
        reproducirSonidoTac();
        
        if (typeof actualizarNavegacionYComentarios === "function") {
            actualizarNavegacionYComentarios();
        }
        
        if (typeof controlarRelojDelTurno === "function") controlarRelojDelTurno();
        
        if (verificarFinDePartida()) return;

        // Disparador opcional automático con retraso
        if (typeof pedirJugadaAlPescado === "function" && !chess.game_over()) {
            setTimeout(() => {
                pedirJugadaAlPescado();
            }, 500); 
        }
    }
    casillaSeleccionada = null;
    redibujarTablero();
}

function verificarFinDePartida() {
    if (chess.game_over()) {
        if (typeof pausarRelojes === 'function') pausarRelojes();
        
        let mensaje = "🏳️ Fin de la partida. ";
        if (chess.in_checkmate()) {
            let ganador = chess.turn() === 'w' ? "Negras ⚫" : "Blancas ⚪";
            mensaje += `¡Jaque Mate! Victoria de las ${ganador}.`;
        } else if (chess.in_draw()) {
            mensaje += "La partida terminó en Tablas (Empate).";
        }
        
        alert(mensaje);
        return true;
    }
    return false;
}

function redibujarTablero() {
    if (!tableroDiv) return;
    tableroDiv.innerHTML = '';
    const board = chess.board();
    let movimientosLegales = [];
    const letras = ['a','b','c','d','e','f','g','h'];

    for (let f = 0; f < 8; f++) {
        for (let c = 0; c < 8; c++) {
            // CORRECCIÓN DE GIRO MÁGICO PARA EVITAR DOBLE TABLERO VISUAL
            const fila = tableroInvertido ? 7 - f : f;
            const col = tableroInvertido ? 7 - c : c;
            
            const casilla = document.createElement('div');
            casilla.className = `casilla ${(fila + col) % 2 === 0 ? 'clara' : 'oscura'}`;
            const notacionCasillaActual = letras[col] + (8 - fila);

            if (casillaSeleccionada && casillaSeleccionada.fila === fila && casillaSeleccionada.col === col) {
                casilla.classList.add('seleccionada');
            }

            // Etiquetas laterales de números e inferiores de letras corregidas al girar
            if (c === 0) {
                const numLabel = document.createElement('span');
                numLabel.className = 'coordenada-notacion coordenada-numero';
                numLabel.innerText = 8 - fila;
                casilla.appendChild(numLabel);
            }
            if (f === 7) {
                const letLabel = document.createElement('span');
                letLabel.className = 'coordenada-notacion coordenada-letra';
                letLabel.innerText = letras[col];
                casilla.appendChild(letLabel);
            }

            const piezaObjeto = board[fila][col];
            if (piezaObjeto) {
                const img = document.createElement('img');
                img.className = 'pieza';
                const letraPieza = piezaObjeto.color === 'w' ? piezaObjeto.type.toUpperCase() : piezaObjeto.type.toLowerCase();
                img.src = _0xPz[letraPieza];
                
                if (piezaObjeto.color === chess.turn()) {
                    img.draggable = true;
                    img.ondragstart = (e) => {
                        casillaSeleccionada = { fila, col };
                        e.dataTransfer.setData('text/plain', notacionCasillaActual);
                    };
                }
                casilla.appendChild(img);
            }
            
            casilla.ondragover = (e) => e.preventDefault();
            casilla.ondrop = (e) => {
                e.preventDefault();
                const origen = e.dataTransfer.getData('text/plain');
                if (origen) ejecutarMovimientoLogico(origen, notacionCasillaActual);
            };

            casilla.onclick = () => manejarClickCasilla(f, c);
            tableroDiv.appendChild(casilla);
        }
    }
}

function manejarClickCasilla(f, c) {
    const fila = tableroInvertido ? 7 - f : f;
    const col = tableroInvertido ? 7 - c : c;
    const letras = ['a','b','c','d','e','f','g','h'];
    const casillaDestino = letras[col] + (8 - fila);

    if (casillaSeleccionada) {
        const casillaOrigen = letras[casillaSeleccionada.col] + (8 - casillaSeleccionada.fila);
        ejecutarMovimientoLogico(casillaOrigen, casillaDestino);
    } else {
        const pieza = chess.board()[fila][col];
        if (pieza && pieza.color === chess.turn()) {
            casillaSeleccionada = { fila, col };
            redibujarTablero();
        }
    }
}

redibujarTablero();
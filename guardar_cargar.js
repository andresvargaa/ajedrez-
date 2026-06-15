function compartirPartidaAhorro() {
    let pgnMovimientos = [];
    for(let i=1; i<historialArbol.length; i++) {
        pgnMovimientos.push(historialArbol[i].san);
    }
    
    let datosAEnviar = pgnMovimientos.length === 0 ? "INICIO_LIBRE" : pgnMovimientos.join(',');
    let codigoCompacto = btoa(datosAEnviar); 
    
    navigator.clipboard.writeText(codigoCompacto);
    alert("¡Código de internet copiado! Pégalo en el chat de tu amigo. No necesita escribir coordenadas para sincronizarse.");
    document.getElementById('input-barrita-carga').value = codigoCompacto;
}

function irAtras() {
    if (indiceHistorial > 0) {
        indiceHistorial--;
        chess.load(historialArbol[indiceHistorial].fen);
        reproducirSonidoTac();
        actualizarNavegacionYComentarios();
        redibujarTablero();
    }
}

function irAdelante() {
    if (indiceHistorial < historialArbol.length - 1) {
        indiceHistorial++;
        chess.load(historialArbol[indiceHistorial].fen);
        reproducirSonidoTac();
        actualizarNavegacionYComentarios();
        redibujarTablero();
    }
}

function actualizarNavegacionYComentarios() {
    document.getElementById('btn-atras').disabled = (indiceHistorial === 0);
    document.getElementById('btn-adelante').disabled = (indiceHistorial === historialArbol.length - 1);
    let nodo = historialArbol[indiceHistorial];
    
    if(indiceHistorial === 0) {
        document.getElementById('titulo-jugada').innerText = `📝 ANÁLISIS LIBRE`;
        document.getElementById('contador-variantes').innerText = "Abierto";
    } else {
        let nJugada = Math.ceil(indiceHistorial / 2);
        let color = (indiceHistorial % 2 !== 0) ? "Blancas" : "Negras";
        document.getElementById('titulo-jugada').innerText = `📝 JUGADA ${nJugada} - ${color}`;
    }
    document.getElementById('cuadro-comentarios-dinamico').value = nodo.comentario || "";
}

function guardarComentarioManual() {
    historialArbol[indiceHistorial].comentario = document.getElementById('cuadro-comentarios-dinamico').value;
}

function reiniciarTodo() {
    chess.reset();
    historialArbol = [{ fen: chess.fen(), comentario: "Posición restablecida. Listo para jugar.", san: "Inicio", lineaMovs: "" }];
    indiceHistorial = 0;
    if (relojIntervalo) {
        clearInterval(relojIntervalo);
        relojIntervalo = null;
    }
    if (typeof cambiarModoTiempo === "function") cambiarModoTiempo();
    document.getElementById('input-barrita-carga').value = '';
    document.getElementById('codigo-salida').value = '';
    actualizarNavegacionYComentarios();
    redibujarTablero();
}

function procesarYDividirCarga() {
    const input = document.getElementById('input-barrita-carga').value.trim();
    if (!input) return;

    try {
        let textoDecodificado = atob(input);
        if (textoDecodificado === "INICIO_LIBRE") {
            reiniciarTodo();
            return;
        }
        
        let jugadas = textoDecodificado.split(',');
        reiniciarTodo();
        for(let j of jugadas) {
            let jLimpia = j.replace('+','').replace('#','');
            let movimientosLegales = chess.moves();
            let encontrado = movimientosLegales.find(m => traducirAlEspañol(m).replace('+','').replace('#','') === jLimpia);
            if(encontrado) chess.move(encontrado);
        }
        historialArbol = [{ fen: chess.fen(), comentario: "Línea libre sincronizada desde chat.", san: "Importado", lineaMovs: "" }];
        indiceHistorial = 0;
        actualizarNavegacionYComentarios(); redibujarTablero();
        return;
    } catch(e) {
    }

    let validador = new Chess();
    if (input.split('/').length >= 6) {
        if (validador.load(input)) {
            chess.load(input);
            historialArbol = [{ fen: chess.fen(), comentario: "Posición cargada.", san: "FEN", lineaMovs: "" }];
            indiceHistorial = 0;
            actualizarNavegacionYComentarios(); redibujarTablero();
        }
    }
}

// FUNCIÓN MÁGICA PARA SORTEAR COLORES (BLANCAS O NEGRAS)
function lanzarMonedaSuerte() {
    if (audioCtx && audioCtx.state !== 'suspended') {
        const ahora = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ahora); 
        osc.frequency.exponentialRampToValueAtTime(1500, ahora + 0.15);
        
        gain.gain.setValueAtTime(0.3, ahora);
        gain.gain.exponentialRampToValueAtTime(0.01, ahora + 0.3);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(ahora + 0.3);
    }

    const suerte = Math.random() < 0.5;
    const cajaComentarios = document.getElementById('cuadro-comentarios-dinamico');
    
    if (suerte) {
        cajaComentarios.value = "🪙 ¡LAS MANITOS MÁGICAS HABLAN!\n\nTe tocan las piezas: ⚪ BLANCAS (Mueves primero).\nTu amigo juega con: ⚫ NEGRAS.\n\n¡Buena partida!";
        if (tableroInvertido) girarTablero();
    } else {
        cajaComentarios.value = "🪙 ¡LAS MANITOS MÁGICAS HABLAN!\n\nTe tocan las piezas: ⚫ NEGRAS.\nTu amigo juega con: ⚪ BLANCAS (Mueve primero).\n\n¡Prepara tu defensa!";
        if (!tableroInvertido) girarTablero();
    }
    
    document.getElementById('titulo-jugada').innerText = "🪙 SORTEO DE COLOR";
    document.getElementById('contador-variantes').innerText = "¡Moneda lanzada!";
    document.getElementById('contador-variantes').style.color = "#ffa726";
}
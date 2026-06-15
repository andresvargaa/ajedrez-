// =====================================================================
// MOTOR SENSORIAL DEL TIEMPO Y MANITOS MÁGICAS INTERNAS
// ARCHIVO: relojes.js - COMPLETO Y MODIFICADO
// =====================================================================

let tiempoBlancas = 600; 
let tiempoNegras = 600;  
let segunderoIntervalo = null;
let modoAnalisisLibre = true; 

function refrescarRelojesEnPantalla() {
    let displayB = document.getElementById('tiempo-blancas');
    let displayN = document.getElementById('tiempo-negras');

    if (modoAnalisisLibre) {
        if (displayB) displayB.innerText = "♾️";
        if (displayN) displayN.innerText = "♾️";
        return;
    }

    let minB = Math.floor(tiempoBlancas / 60);
    let segB = tiempoBlancas % 60;
    let minN = Math.floor(tiempoNegras / 60);
    let segN = tiempoNegras % 60;

    if (displayB) displayB.innerText = `${minB}:${segB < 10 ? '0' : ''}${segB}`;
    if (displayN) displayN.innerText = `${minN}:${segN < 10 ? '0' : ''}${segN}`;
}

function controlarRelojDelTurno() {
    if (modoAnalisisLibre) {
        pausarRelojes();
        refrescarRelojesEnPantalla();
        return;
    }

    if (segunderoIntervalo) clearInterval(segunderoIntervalo);

    segunderoIntervalo = setInterval(() => {
        if (typeof chess !== 'undefined') {
            if (chess.turn() === 'w') {
                if (tiempoBlancas > 0) {
                    tiempoBlancas--;
                } else {
                    clearInterval(segunderoIntervalo);
                    alert("⏱️ ¡Tiempo agotado! Fin del juego para las Blancas.");
                }
            } else {
                if (tiempoNegras > 0) {
                    tiempoNegras--;
                } else {
                    clearInterval(segunderoIntervalo);
                    alert("⏱️ ¡Tiempo agotado! Fin del juego para las Negras.");
                }
            }
            refrescarRelojesEnPantalla();
        }
    }, 1000);
}

function pausarRelojes() {
    if (segunderoIntervalo) clearInterval(segunderoIntervalo);
}

function cambiarModoTiempo() {
    pausarRelojes();
    let selector = document.getElementById('select-tiempo-modo');
    if (!selector) return;

    let valor = selector.value;

    if (valor === "analisis") {
        modoAnalisisLibre = true;
    } else if (valor === "personalizado") {
        modoAnalisisLibre = false;
        let minutosEntrada = prompt("Configuración Personalizada:\n¿Minutos por jugador?", "15");
        let minutos = parseInt(minutosEntrada);
        
        if (!isNaN(minutos) && minutos > 0) {
            tiempoBlancas = minutos * 60;
            tiempoNegras = minutos * 60;
        } else {
            modoAnalisisLibre = true;
            selector.value = "analisis";
        }
    } else {
        modoAnalisisLibre = false;
        let minutosFijos = parseInt(valor);
        tiempoBlancas = minutosFijos * 60;
        tiempoNegras = minutosFijos * 60;
    }

    refrescarRelojesEnPantalla();
}

function reiniciarPartidaTotal() {
    pausarRelojes();
    if (typeof chess !== 'undefined') chess.reset();
    cambiarModoTiempo();
    if (typeof redibujarTablero === 'function') redibujarTablero();
}

// 🪙 FUNCIÓN INTEGRADA DE MANITOS MÁGICAS PARA REINICIAR CON EL MOTOR
function lanzarMonedaSuerte() {
    if (typeof chess !== 'undefined') chess.reset();
    pausarRelojes();
    cambiarModoTiempo();

    let suerte = Math.floor(Math.random() * 2);
    let cajaComentarios = document.getElementById('cuadro-comentarios-dinamico');
    
    if (suerte === 0) {
        // Al humano le tocan Blancas
        tableroInvertido = false;
        if (cajaComentarios) {
            cajaComentarios.value = "🪙 MANITOS MÁGICAS:\n\nTe tocan las piezas: ⚪ BLANCAS.\nMueves tú primero en el tablero. ¡A por ellos!";
        }
        if (typeof redibujarTablero === 'function') redibujarTablero();
        controlarRelojDelTurno();
    } else {
        // Al Pescado le tocan Blancas
        tableroInvertido = true;
        if (cajaComentarios) {
            cajaComentarios.value = "🪙 MANITOS MÁGICAS:\n\nTe tocan las piezas: ⚫ NEGRAS.\nEl Pescado lleva Blancas y ejecuta su primer movimiento ahora mismo...";
        }
        if (typeof redibujarTablero === 'function') redibujarTablero();
        controlarRelojDelTurno();

        // El motor juega de inmediato su primera jugada con Blancas
        setTimeout(() => {
            if (typeof pedirJugadaAlPescado === 'function') pedirJugadaAlPescado();
        }, 600);
    }

    if (typeof reproducirSonidoTac === 'function') reproducirSonidoTac();
}

window.lanzarMonedaSuerte = lanzarMonedaSuerte;
refrescarRelojesEnPantalla();
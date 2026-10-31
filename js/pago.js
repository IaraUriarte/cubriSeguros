// js/pago.js

/**
 * Simula la aprobación o rechazo del pago según el número de tarjeta (Sección 5.3)
 */
export function simularPago(numero) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const limpio = String(numero).replace(/\s/g, '');
            if (limpio === '4000000000000002') {
                resolve({ ok: false, motivo: 'Tarjeta rechazada' });
            } else {
                resolve({ ok: true });
            }
        }, 1500);
    });
}

let contadorPoliza = 123; // Número correlativo de ejemplo

/**
 * Genera un número de póliza con el formato: POL-AAAA-NNNNNN
 */
export function generarPoliza() {
    const anio = new Date().getFullYear();
    const numPad = String(contadorPoliza++).padStart(6, '0');
    return `POL-${anio}-${numPad}`;
}
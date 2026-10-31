import { solicitud, actualizarPaso } from './estado.js';

function render() {
    const pasoActual = solicitud.paso;
    const enCheckout = pasoActual >= 1 && pasoActual <= 4;

    document.querySelectorAll('[data-paso]').forEach((seccion) => {
        seccion.hidden = Number(seccion.dataset.paso) !== pasoActual;
    });

    document.getElementById('checkout-shell').hidden = !enCheckout;
    document.getElementById('resumen-lateral').hidden = !enCheckout;
    document.getElementById('stepper-container').classList.toggle('hidden', !enCheckout);

    document.querySelectorAll('[data-step]').forEach((item) => {
        const numero = Number(item.dataset.step);
        const completado = numero < pasoActual;
        const activo = numero === pasoActual;
        item.classList.toggle('is-complete', completado);
        item.classList.toggle('is-active', activo);
        if (activo) {
            item.setAttribute('aria-current', 'step');
        } else {
            item.removeAttribute('aria-current');
        }
        const indicador = item.querySelector('span');
        indicador.textContent = completado ? '✓' : String(numero);
    });
}

function irAPaso(paso) {
    actualizarPaso(paso);
    render();
    window.scrollTo(0, 0);
}

document.addEventListener('DOMContentLoaded', () => {
    render();

    document.querySelectorAll('#btn-iniciar-celular, #btn-iniciar-celular-card')
        .forEach((boton) => boton.addEventListener('click', () => irAPaso(1)));

    document.querySelectorAll('.btn-volver').forEach((boton) => {
        boton.addEventListener('click', () => irAPaso(Math.max(0, solicitud.paso - 1)));
    });

    [
        ['btn-paso-1-siguiente', 2],
        ['btn-paso-2-siguiente', 3],
        ['btn-paso-3-siguiente', 4]
    ].forEach(([id, paso]) => {
        document.getElementById(id).addEventListener('click', () => irAPaso(paso));
    });
});
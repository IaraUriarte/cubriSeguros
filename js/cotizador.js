// js/cotizador.js

// Factores según la antigüedad del equipo (Sección 5.1)
const FACTORES_ANTIGUEDAD = {
    'menos_1': 1.00,
    '1_a_2': 1.10,
    'mas_2': 1.25
};

const formatoValorEquipo = new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 0
});

export function formatearValorEquipo(valor) {
    const numero = Number(String(valor).replace(/\D/g, ''));
    return numero ? formatoValorEquipo.format(numero) : '';
}

/**
 * Calcula la cuota mensual de un plan según el valor del equipo, la tasa anual y la antigüedad.
 * Fórmula: Math.round(valor * tasaAnual / 12 * factorAntiguedad)
 */
export function calcularCuota(valor, tasaAnual, antiguedadKey) {
    const factor = FACTORES_ANTIGUEDAD[antiguedadKey] || 1.00;
    const numValor = Number(valor) || 0;
    return Math.round((numValor * tasaAnual / 12) * factor);
}

/**
 * Carga los planes desde el JSON local (data/planes.json)
 */
export async function cargarPlanes() {
    const response = await fetch('./data/planes.json');
    if (!response.ok) {
        throw new Error(`No se pudieron cargar los planes: HTTP ${response.status}`);
    }

    return response.json();
}
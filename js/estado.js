// js/estado.js
export const solicitud = {
    paso: 0, // 0 = inicio/catálogo, 1 a 4 = checkout, 5 = éxito, 6 = error
    equipo: {
        marca: '',
        modelo: '',
        valor: 0,
        antiguedad: ''
    },
    plan: 'plus',
    titular: {
        nombre: '',
        apellido: '',
        dni: '',
        nacimiento: '',
        email: '',
        celular: '',
        terminos: false
    },
    pago: {
        metodo: 'credito',
        tarjeta: '',
        vencimiento: '',
        cvv: '',
        titular: '',
        motivo: ''
    },
    poliza: null
};

export function actualizarPaso(paso) {
    solicitud.paso = paso;
}
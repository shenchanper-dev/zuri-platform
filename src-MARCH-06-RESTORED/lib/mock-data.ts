export const drivers = [
  {
    id: 1,
    nombre: "Juan Pérez",
    licencia: "A-123456",
    telefono: "999111222",
    estado: "Disponible",
    ubicacion: { lat: -12.0464, lng: -77.0428 },
  },
  {
    id: 2,
    nombre: "María López",
    licencia: "B-654321",
    telefono: "988777444",
    estado: "En servicio",
    ubicacion: { lat: -12.0450, lng: -77.0310 },
  },
];

export const trips = [
  {
    id: 101,
    conductorId: 1,
    destino: "Clínica Anglo Americana",
    horaSalida: "2025-10-08T09:30:00Z",
    estado: "Pendiente",
  },
  {
    id: 102,
    conductorId: 2,
    destino: "Hospital Rebagliati",
    horaSalida: "2025-10-08T10:00:00Z",
    estado: "En curso",
  },
];

export default {
  drivers,
  trips,
};

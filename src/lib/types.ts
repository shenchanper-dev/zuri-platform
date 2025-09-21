export type Driver = {
  id: string;
  name: string;
  status: 'available' | 'in-trip' | 'offline';
  location: {
    lat: number;
    lng: number;
  };
  vehicle: string;
  rating: number;
  tripsToday: number;
  // Fields from the form
  dni?: string;
  dob?: Date;
  phone1?: string;
  phone2?: string;
  address?: string;
  district?: string;
  email?: string;
  licenseNumber?: string;
  carBrand?: string;
  carModel?: string;
  plateNumber?: string;
  owner?: string;
  civilStatus?: "Soltero(a)" | "Casado(a)" | "Viudo(a)" | "Divorciado(a)";
  childrenCount?: number;
  contactName?: string;
  contactPhone?: string;
  hireDate?: Date;
  fireDate?: Date;
  observations?: string;
};

export type Clinic = {
  id: string;
  name: string;
  address?: string;
  centralPhone?: string;
  clinicEmail?: string;
  contactName1?: string;
  charge1?: string;
  cellphone1?: string;
  emailCli1?: string;
  contactName2?: string;
  charge2?: string;
  cellphone2?: string;
  emailCli2?: string;
  serviceTypes?: string;
};

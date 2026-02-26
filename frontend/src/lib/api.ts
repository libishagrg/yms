import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5140",
  withCredentials: true,
});

export type LocationDock = {
  id: number;
  name: string;
  zoneId: number;
};

export type LocationZone = {
  id: number;
  name: string;
  yardId: number;
  docks: LocationDock[];
};

export type LocationYard = {
  id: number;
  name: string;
  areaId: number;
  zones: LocationZone[];
};

export type LocationArea = {
  id: number;
  name: string;
  yards: LocationYard[];
};

export type CarrierRecord = {
  id: number;
  name: string;
  scac: string | null;
  contactPerson: string | null;
  contactPhone: string | null;
  notes: string | null;
  isActive: boolean;
};

export async function getLocationTree() {
  const response = await api.get<LocationArea[]>("/api/locations/tree");
  return response.data;
}

export async function createArea(payload: { name: string }) {
  const response = await api.post<{ id: number; name: string }>("/api/locations/areas", payload);
  return response.data;
}

export async function updateArea(id: number, payload: { name: string }) {
  const response = await api.put<{ id: number; name: string }>(`/api/locations/areas/${id}`, payload);
  return response.data;
}

export async function deleteArea(id: number) {
  await api.delete(`/api/locations/areas/${id}`);
}

export async function createYard(payload: { name: string; areaId: number }) {
  const response = await api.post<{ id: number; name: string; areaId: number }>(
    "/api/locations/yards",
    payload,
  );
  return response.data;
}

export async function updateYard(id: number, payload: { name: string }) {
  const response = await api.put<{ id: number; name: string; areaId: number }>(
    `/api/locations/yards/${id}`,
    payload,
  );
  return response.data;
}

export async function deleteYard(id: number) {
  await api.delete(`/api/locations/yards/${id}`);
}

export async function createZone(payload: { name: string; yardId: number }) {
  const response = await api.post<{ id: number; name: string; yardId: number }>(
    "/api/locations/zones",
    payload,
  );
  return response.data;
}

export async function updateZone(id: number, payload: { name: string }) {
  const response = await api.put<{ id: number; name: string; yardId: number }>(
    `/api/locations/zones/${id}`,
    payload,
  );
  return response.data;
}

export async function deleteZone(id: number) {
  await api.delete(`/api/locations/zones/${id}`);
}

export async function createDock(payload: { name: string; zoneId: number }) {
  const response = await api.post<{ id: number; name: string; zoneId: number }>(
    "/api/locations/docks",
    payload,
  );
  return response.data;
}

export async function updateDock(id: number, payload: { name: string }) {
  const response = await api.put<{ id: number; name: string; zoneId: number }>(
    `/api/locations/docks/${id}`,
    payload,
  );
  return response.data;
}

export async function deleteDock(id: number) {
  await api.delete(`/api/locations/docks/${id}`);
}

export async function getCarriers() {
  const response = await api.get<CarrierRecord[]>("/api/carriers");
  return response.data;
}

type CarrierWritePayload = {
  name: string;
  scac?: string | null;
  contactPerson?: string | null;
  contactPhone?: string | null;
  notes?: string | null;
  isActive: boolean;
};

export async function createCarrier(payload: CarrierWritePayload) {
  const response = await api.post<CarrierRecord>("/api/carriers", payload);
  return response.data;
}

export async function updateCarrier(id: number, payload: CarrierWritePayload) {
  const response = await api.put<CarrierRecord>(`/api/carriers/${id}`, payload);
  return response.data;
}

export async function deleteCarrier(id: number) {
  await api.delete(`/api/carriers/${id}`);
}

export default api;

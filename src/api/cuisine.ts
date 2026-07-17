import type { Paginated } from '../types/api'; import type { CuisineAdminItem,CuisinePayload,CuisineQuery } from '../types/cuisine'; import { apiClient,unwrap,unwrapPaginated } from './client';
export function fetchCuisineItems(query:CuisineQuery,signal?:AbortSignal):Promise<Paginated<CuisineAdminItem>>{return unwrapPaginated(apiClient.get('/admin/cuisine',{params:query,signal}));}
export function fetchCuisineItem(id:string,signal?:AbortSignal):Promise<CuisineAdminItem>{return unwrap(apiClient.get(`/admin/cuisine/${id}`,{signal}));}
export function createCuisineItem(payload:CuisinePayload):Promise<CuisineAdminItem>{return unwrap(apiClient.post('/admin/cuisine',payload));}
export function updateCuisineItem(id:string,payload:CuisinePayload&{version:number}):Promise<CuisineAdminItem>{return unwrap(apiClient.put(`/admin/cuisine/${id}`,payload));}
export async function deleteCuisineItem(id:string):Promise<void>{await apiClient.delete(`/admin/cuisine/${id}`);}
export function updateCuisineStatus(id:string,isActive:boolean,version:number):Promise<CuisineAdminItem>{return unwrap(apiClient.patch(`/admin/cuisine/${id}/status`,{isActive,version}));}
export function reorderCuisineItems(items:Array<{id:string;sortOrder:number}>):Promise<CuisineAdminItem[]>{return unwrap(apiClient.patch('/admin/cuisine/reorder',{items}));}

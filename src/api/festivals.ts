import type{Paginated}from'../types/api';import type{FestivalAdminItem,FestivalPayload,FestivalQuery}from'../types/festival';import{apiClient,unwrap,unwrapPaginated}from'./client';
export function fetchFestivals(query:FestivalQuery,signal?:AbortSignal):Promise<Paginated<FestivalAdminItem>>{return unwrapPaginated(apiClient.get('/admin/festivals',{params:query,signal}));}
export function fetchFestival(id:string,signal?:AbortSignal):Promise<FestivalAdminItem>{return unwrap(apiClient.get(`/admin/festivals/${id}`,{signal}));}
export function createFestival(payload:FestivalPayload):Promise<FestivalAdminItem>{return unwrap(apiClient.post('/admin/festivals',payload));}
export function updateFestival(id:string,payload:FestivalPayload&{version:number}):Promise<FestivalAdminItem>{return unwrap(apiClient.put(`/admin/festivals/${id}`,payload));}
export async function deleteFestival(id:string):Promise<void>{await apiClient.delete(`/admin/festivals/${id}`);}
export function updateFestivalStatus(id:string,isActive:boolean,version:number):Promise<FestivalAdminItem>{return unwrap(apiClient.patch(`/admin/festivals/${id}/status`,{isActive,version}));}
export function reorderFestivals(items:Array<{id:string;sortOrder:number}>):Promise<FestivalAdminItem[]>{return unwrap(apiClient.patch('/admin/festivals/reorder',{items}));}

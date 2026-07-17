export const FESTIVAL_CATEGORIES=['Lễ truyền thống','Văn hóa cộng đồng','Thể thao - vui chơi','Sự kiện nông sản'] as const;
export type FestivalCategory=(typeof FESTIVAL_CATEGORIES)[number];
export interface FestivalAdminItem{id:string;version:number;name:string;category:FestivalCategory;time:string;location:string;scale:string;summary:string;description:string[];activities:string[];note:string;mediaId:string|null;imageUrl:string|null;imageAlt:string;sortOrder:number;isActive:boolean;updatedAt:string;updatedBy?:string|null;}
export interface FestivalQuery{page:number;limit:number;category?:FestivalCategory;search?:string;}
export interface FestivalPayload{name:string;category:FestivalCategory;time:string;location:string;scale:string;summary:string;description:string[];activities:string[];note:string;mediaId?:string|null;imageAlt:string;sortOrder?:number;isActive?:boolean;}

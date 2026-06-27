export interface TemplateCatalogItem {
  id: string;
  key: string;
  name: string;
  description: string;
  type: string;
  typeName: string;
  defaultThumbnail: string;
  previewUrl: string;
}

export const TEMPLATE_CATALOG: TemplateCatalogItem[] = [
  {
    id: 'template-10',
    key: 'template-10',
    name: 'Loi Hua Vinh Cuu',
    description: 'Phong cach A Dong truyen thong, mau do son va vang ruc ro',
    type: 'thiep-cuoi',
    typeName: 'Thiep cuoi',
    defaultThumbnail: '/templates/template-10/assets/images/cover_photo.png',
    previewUrl: '/template-preview/template-10',
  },
  {
    id: 'template-11',
    key: 'template-11',
    name: 'Mai Lan Trang',
    description: 'Nhe nhang, lang man voi sac trang va hoa mai',
    type: 'thiep-cuoi',
    typeName: 'Thiep cuoi',
    defaultThumbnail: '/assets/images/template-11/preview.png',
    previewUrl: '/template-preview/template-11',
  },
  {
    id: 'template-12',
    key: 'template-12',
    name: 'Song Hy Xanh',
    description: 'Tinh te voi tong xanh va trang sang',
    type: 'thiep-cuoi',
    typeName: 'Thiep cuoi',
    defaultThumbnail: '/assets/images/template-12/preview.png',
    previewUrl: '/template-preview/template-12',
  },
  {
    id: 'template-13',
    key: 'template-13',
    name: 'Vuon Xuan Xanh',
    description: 'Tuoi mat voi sac xanh va hoa la',
    type: 'thiep-cuoi',
    typeName: 'Thiep cuoi',
    defaultThumbnail: '/assets/images/template-13/preview.png',
    previewUrl: '/template-preview/template-13',
  },
  {
    id: 'template-14',
    key: 'template-14',
    name: 'Vuon Xuan Xanh Premium',
    description: 'Ban premium cua phong cach vuon xuan xanh',
    type: 'thiep-cuoi',
    typeName: 'Thiep cuoi',
    defaultThumbnail: '/assets/images/template-14/preview.png',
    previewUrl: '/template-preview/template-14',
  },
  {
    id: 'template-15',
    key: 'template-15',
    name: 'Thanh Loc & Minh Thu',
    description: 'Toi gian, hien dai va sang trong',
    type: 'thiep-cuoi',
    typeName: 'Thiep cuoi',
    defaultThumbnail: '/assets/images/template-15/preview.png',
    previewUrl: '/template-preview/template-15',
  },
  {
    id: 'template-16',
    key: 'template-16',
    name: 'Thanh Diep Xanh',
    description: 'Nhe nhang voi tong xanh la va trang',
    type: 'thiep-cuoi',
    typeName: 'Thiep cuoi',
    defaultThumbnail: '/assets/images/template-16/preview.png',
    previewUrl: '/template-preview/template-16',
  },
  {
    id: 'template-17',
    key: 'template-17',
    name: 'Hoa Moc Hong',
    description: 'Lang man voi sac hong va hoa moc',
    type: 'thiep-cuoi',
    typeName: 'Thiep cuoi',
    defaultThumbnail: '/assets/images/template-17/photo1.jpg',
    previewUrl: '/template-preview/template-17',
  },
  {
    id: 'template-18',
    key: 'template-18',
    name: 'Vuon Xuan Do',
    description: 'Am ap voi sac do va hoa xuan',
    type: 'thiep-cuoi',
    typeName: 'Thiep cuoi',
    defaultThumbnail: '/assets/images/template-18/photo1.jpg',
    previewUrl: '/template-preview/template-18',
  },
  {
    id: 'template-19',
    key: 'template-19',
    name: 'Minimalism Do',
    description: 'Toi gian voi sac do va trang',
    type: 'thiep-cuoi',
    typeName: 'Thiep cuoi',
    defaultThumbnail: '/assets/images/template-19/photo1.jpg',
    previewUrl: '/template-preview/template-19',
  },
];

export const TEMPLATE_CATALOG_BY_ID = Object.fromEntries(
  TEMPLATE_CATALOG.map((template) => [template.id, template])
) as Record<string, TemplateCatalogItem>;

export function getTemplateCatalogItem(id?: string | null) {
  return id ? TEMPLATE_CATALOG_BY_ID[id] : undefined;
}

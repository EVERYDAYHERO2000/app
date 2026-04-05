export type AdminPriceItem = {
  id: string;
  materialId: string;
  name: string;
  description?: string | null;
  basePricePerUnit?: string | number | null;
  markupPercent?: number | null;
  pricePerUnit: string | number;
  currency: string;
  isActive: boolean;
  sortOrder: number;
};

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  imageKey?: string | null;
  unit: string;
  isActive: boolean;
  sortOrder: number;
  submaterials: AdminPriceItem[];
};

export const IMAGE_OPTIONS = [
  { value: 'sand', label: 'Песок' },
  { value: 'gravel', label: 'Щебень' },
  { value: 'asphalt', label: 'Асфальт' },
];

export function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '');
}


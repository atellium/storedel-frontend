import type { ProductCategory } from "@/features/products/types";

export function normalizeCategorySearch(value: string) {
  return value.trim().toLowerCase();
}

export function searchProductCategories(
  categories: ProductCategory[],
  query: string,
) {
  const normalizedQuery = normalizeCategorySearch(query);

  if (!normalizedQuery) {
    return [...categories].sort((left, right) => left.sort_order - right.sort_order);
  }

  return categories.filter((category) => {
    const aliases = category.aliases
      .split(",")
      .map(normalizeCategorySearch)
      .join(" ");
    const searchText = `${normalizeCategorySearch(category.name)} ${aliases}`;

    return searchText.includes(normalizedQuery);
  });
}

import Link from "next/link";
import { CategoryNode } from "../types/catalog.types";

interface CategoryNavProps {
  categories: CategoryNode[];
  activeSlug?: string;
}

export function CategoryNav({ categories, activeSlug }: CategoryNavProps) {
  if (categories.length === 0) return null;

  return (
    <nav aria-label="Categories" className="flex flex-col gap-1">
      <CategoryLink label="All products" href="/products" isActive={!activeSlug} />
      {categories.map((category) => (
        <CategoryTreeItem
          key={category.id}
          category={category}
          activeSlug={activeSlug}
        />
      ))}
    </nav>
  );
}

function CategoryTreeItem({
  category,
  activeSlug,
}: {
  category: CategoryNode;
  activeSlug?: string;
}) {
  return (
    <div>
      <CategoryLink
        label={category.name}
        href={`/products?category=${category.slug}`}
        isActive={category.slug === activeSlug}
      />
      {category.children.length > 0 && (
        <div className="ml-4 flex flex-col gap-1">
          {category.children.map((child) => (
            <CategoryTreeItem key={child.id} category={child} activeSlug={activeSlug} />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryLink({
  label,
  href,
  isActive,
}: {
  label: string;
  href: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`cursor-pointer rounded-md px-3 py-1.5 text-sm transition-colors duration-200 ${
        isActive
          ? "bg-(--color-muted) font-semibold text-(--color-primary)"
          : "text-(--color-foreground) hover:bg-(--color-muted)"
      }`}
    >
      {label}
    </Link>
  );
}

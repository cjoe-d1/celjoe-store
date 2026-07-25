import clsx from "clsx";
import Link from "next/link";
import Image from "next/image";

export type CategoryModel = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  description?: string | null;
  href?: string;
};

export function CategoryTile({
  category,
  className,
}: {
  category: CategoryModel;
  className?: string;
}) {
  const href = category.href ?? `/search/${category.slug}`;

  return (
    <Link
      href={href}
      className={clsx(
        "group block overflow-hidden rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] shadow-[var(--ds-shadow-sm)] transition-[box-shadow,transform] duration-[var(--ds-duration-base)] ease-[var(--ds-ease-decelerate)] hover:shadow-[var(--ds-shadow-md)]",
        "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ds-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-color-bg)]",
        className,
      )}
    >
      <div className="relative aspect-[4/3] w-full bg-[var(--ds-color-surface-muted)]">
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt={category.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-[var(--ds-duration-slow)] ease-[var(--ds-ease-decelerate)] group-hover:scale-[1.02]"
          />
        ) : null}
      </div>
      <div className="p-[var(--ds-space-5)]">
        <div className="text-[length:var(--ds-text-h4)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
          {category.name}
        </div>
        {category.description ? (
          <div className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
            {category.description}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export function CategoryGrid({
  categories,
  className,
}: {
  categories: CategoryModel[];
  className?: string;
}) {
  return (
    <div className={clsx("grid grid-cols-1 gap-[var(--ds-space-4)] sm:grid-cols-2 lg:grid-cols-3", className)}>
      {categories.map((c) => (
        <CategoryTile key={c.id} category={c} />
      ))}
    </div>
  );
}

export function CategoryHero({
  title,
  description,
  imageUrl,
  className,
}: {
  title: string;
  description?: string;
  imageUrl?: string | null;
  className?: string;
}) {
  return (
    <section
      className={clsx(
        "overflow-hidden rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] shadow-[var(--ds-shadow-sm)]",
        className,
      )}
    >
      <div className="grid grid-cols-1 gap-[var(--ds-space-6)] p-[var(--ds-space-6)] lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <h1 className="text-[length:var(--ds-text-h1)] font-[var(--ds-font-weight-medium)] leading-[var(--ds-leading-heading)] text-[var(--ds-color-fg)]">
            {title}
          </h1>
          {description ? (
            <p className="mt-[var(--ds-space-3)] text-[length:var(--ds-text-body)] leading-[var(--ds-leading-body)] text-[var(--ds-color-muted)]">
              {description}
            </p>
          ) : null}
        </div>
        {imageUrl ? (
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--ds-radius-lg)] bg-[var(--ds-color-surface-muted)]">
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(min-width: 1024px) 33vw, 100vw"
              className="object-cover"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

export type CategoryNavItem = {
  id: string;
  label: string;
  href: string;
  active?: boolean;
};

export function CategoryNavigation({
  title = "Categories",
  items,
  className,
}: {
  title?: string;
  items: CategoryNavItem[];
  className?: string;
}) {
  return (
    <nav className={clsx(className)} aria-label={title}>
      <div className="mb-[var(--ds-space-3)] text-[length:var(--ds-text-label)] uppercase tracking-wide text-[var(--ds-color-muted)]">
        {title}
      </div>
      <ul className="flex flex-wrap gap-[var(--ds-space-2)]">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={clsx(
                "inline-flex items-center rounded-full border px-[var(--ds-space-4)] py-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] transition-[background-color,color,border-color] duration-[var(--ds-duration-base)] ease-[var(--ds-ease-decelerate)]",
                "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ds-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-color-bg)]",
                item.active
                  ? "border-[var(--ds-color-accent)] bg-[var(--ds-color-accent)] text-white"
                  : "border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] text-[var(--ds-color-fg)] hover:bg-[var(--ds-color-surface-muted)]",
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}


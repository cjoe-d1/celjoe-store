import Footer from "components/layout/footer";
import {
  HomeCuratedCategoriesSection,
  HomeFeatureSection,
  HomeFinalInvitationSection,
  HomeGuestStoriesSection,
  HomeHeroSection,
  HomeProductSection,
  HomeStandardSection,
} from "features/home/sections";
import { getCategories, getCategoriesByIds } from "lib/supabase/categories";
import { getFeaturedProducts, getProductsByIds } from "lib/supabase/products";
import { getHomepageSections } from "lib/supabase/homepage";
import type { Category } from "lib/supabase/categories";
import type { Product } from "lib/supabase/products";

const { SITE_NAME } = process.env;

const DEFAULT_HERO = {
  headline: "Celjoe Store",
  subheadline: "From our kitchen to your table — crafted with care, served with heart.",
  primaryCta: { label: "Explore the Menu", href: "/search" },
  secondaryCta: { label: "Our Story", href: "/our-story" },
};

const DEFAULT_TODAYS_KITCHEN = { title: "Today's Kitchen" };
const DEFAULT_CURATION_TITLE = "Curated Categories";
const DEFAULT_CHEFS_TABLE = { title: "Chef's Recommendation" };
const DEFAULT_SMOKEHOUSE = { title: "The Smokehouse", description: "Fire-kissed flavors for the bold." };
const DEFAULT_CATERING = { title: "Catering", description: "Elevate every gathering." };
const DEFAULT_STANDARD = { title: "The Celjoe Standard", items: [
  { title: "Hospitality First", description: "Every dish is prepared with intention and care." },
  { title: "Editorial Presentation", description: "Food deserves to be seen, not just eaten." },
  { title: "Premium Craftsmanship", description: "Sourced ingredients, honest technique." },
] };
const DEFAULT_GUEST_STORIES = { title: "Guest Stories" };
const DEFAULT_INVITATION = { headline: "Join us at the table" };

export async function generateMetadata() {
  const sections = await getHomepageSections();
  const hero = sections.find((s) => s.sectionType === "hero")?.content as any;

  const title =
    (typeof hero?.headline === "string" && hero.headline) ??
    (typeof hero?.seo_title === "string" && hero.seo_title) ??
    SITE_NAME ??
    "";

  const description =
    (typeof hero?.seo_description === "string" && hero.seo_description) ?? undefined;

  return {
    title,
    description,
    openGraph: { type: "website" as const },
  };
}

export default async function HomePage() {
  const sections = await getHomepageSections();
  const hasCmsContent = sections.length > 0;
  const contentByType = new Map(sections.map((s) => [s.sectionType, s.content as any]));

  const allProductIds = new Set<string>();
  const allCategoryIds = new Set<string>();

  for (const s of sections) {
    const c: any = s.content;
    for (const id of c?.product_ids ?? c?.productIds ?? []) {
      if (typeof id === "string" && id.trim()) allProductIds.add(id);
    }
    for (const id of c?.category_ids ?? c?.categoryIds ?? []) {
      if (typeof id === "string" && id.trim()) allCategoryIds.add(id);
    }
  }

  const [cmsProducts, cmsCategories] = await Promise.all([
    getProductsByIds(Array.from(allProductIds)),
    getCategoriesByIds(Array.from(allCategoryIds)),
  ]);

  const productsById = new Map(cmsProducts.map((p) => [p.id, p]));
  const categoriesById = new Map(cmsCategories.map((c) => [c.id, c]));

  // Fetch default data for sections not covered by CMS
  const [featuredProducts, rootCategories] = await Promise.all([
    getFeaturedProducts(),
    getCategories({ parentId: null }),
  ]);

  const hero = contentByType.get("hero") as any | undefined;
  const todaysKitchen = contentByType.get("todays_kitchen") as any | undefined;
  const curatedCategories = contentByType.get("curated_categories") as any | undefined;
  const chefsTable = contentByType.get("chefs_table") as any | undefined;
  const smokehouse = contentByType.get("smokehouse") as any | undefined;
  const catering = contentByType.get("catering") as any | undefined;
  const standard = contentByType.get("celjoe_standard") as any | undefined;
  const guestStories = contentByType.get("guest_stories") as any | undefined;
  const finalInvitation = contentByType.get("final_invitation") as any | undefined;

  const heroHeadline = hasCmsContent ? (hero?.headline ?? null) : DEFAULT_HERO.headline;
  const heroSubheadline = hasCmsContent ? (hero?.subheadline ?? null) : DEFAULT_HERO.subheadline;
  const heroImage = hasCmsContent ? (hero?.image_url ?? hero?.imageUrl ?? null) : null;
  const heroPrimaryCta = hasCmsContent ? (hero?.primary_cta ?? hero?.primaryCta ?? null) : DEFAULT_HERO.primaryCta;
  const heroSecondaryCta = hasCmsContent ? (hero?.secondary_cta ?? hero?.secondaryCta ?? null) : DEFAULT_HERO.secondaryCta;
  const heroSeoTitle = hasCmsContent ? (hero?.seo_title ?? hero?.seoTitle ?? null) : null;

  const todaysKitchenTitle = hasCmsContent ? (todaysKitchen?.title ?? null) : DEFAULT_TODAYS_KITCHEN.title;
  const todaysKitchenProducts = hasCmsContent
    ? (todaysKitchen?.product_ids ?? todaysKitchen?.productIds ?? []).map((id: string) => productsById.get(id)).filter(Boolean)
    : featuredProducts;

  const curatedTitle = hasCmsContent ? (curatedCategories?.title ?? null) : DEFAULT_CURATION_TITLE;
  const curatedCategoriesList = hasCmsContent
    ? (curatedCategories?.category_ids ?? curatedCategories?.categoryIds ?? []).map((id: string) => categoriesById.get(id)).filter(Boolean)
    : rootCategories;

  const chefsTableTitle = hasCmsContent ? (chefsTable?.title ?? null) : DEFAULT_CHEFS_TABLE.title;
  const chefsTableProducts = hasCmsContent
    ? (chefsTable?.product_ids ?? chefsTable?.productIds ?? []).map((id: string) => productsById.get(id)).filter(Boolean)
    : featuredProducts.slice(0, 3);

  const smokehouseTitle = hasCmsContent ? (smokehouse?.title ?? null) : DEFAULT_SMOKEHOUSE.title;
  const smokehouseDescription = hasCmsContent ? (smokehouse?.description ?? null) : DEFAULT_SMOKEHOUSE.description;
  const smokehouseImage = hasCmsContent ? (smokehouse?.image_url ?? smokehouse?.imageUrl ?? null) : null;
  const smokehouseCta = hasCmsContent ? (smokehouse?.cta ?? null) : { label: "Explore", href: "/search/smokehouse" };

  const cateringTitle = hasCmsContent ? (catering?.title ?? null) : DEFAULT_CATERING.title;
  const cateringDescription = hasCmsContent ? (catering?.description ?? null) : DEFAULT_CATERING.description;
  const cateringImage = hasCmsContent ? (catering?.image_url ?? catering?.imageUrl ?? null) : null;
  const cateringCta = hasCmsContent ? (catering?.cta ?? null) : { label: "Book an Event", href: "/catering" };

  const standardTitle = hasCmsContent ? (standard?.title ?? null) : DEFAULT_STANDARD.title;
  const standardItems = hasCmsContent
    ? (Array.isArray(standard?.items) ? standard.items : []).map((i: any) => ({
        title: typeof i?.title === "string" ? i.title : "",
        description: typeof i?.description === "string" ? i.description : "",
      })).filter((i: any) => i.title)
    : DEFAULT_STANDARD.items;

  const guestStoriesTitle = hasCmsContent ? (guestStories?.title ?? null) : DEFAULT_GUEST_STORIES.title;
  const guestStoriesData = hasCmsContent
    ? (Array.isArray(guestStories?.stories) ? guestStories.stories : []).map((s: any) => ({
        quote: typeof s?.quote === "string" ? s.quote : "",
        attribution: typeof s?.attribution === "string" ? s.attribution : "",
      })).filter((s: any) => s.quote)
    : [];

  const finalInvitationHeadline = hasCmsContent ? (finalInvitation?.headline ?? null) : DEFAULT_INVITATION.headline;
  const finalInvitationPrimaryCta = hasCmsContent ? (finalInvitation?.primary_cta ?? finalInvitation?.primaryCta ?? null) : { label: "Reserve a Table", href: "/checkout" };
  const finalInvitationSecondaryCta = hasCmsContent ? (finalInvitation?.secondary_cta ?? finalInvitation?.secondaryCta ?? null) : null;

  return (
    <>
      <HomeHeroSection
        headline={heroHeadline}
        subheadline={heroSubheadline}
        imageUrl={heroImage}
        primaryCta={heroPrimaryCta}
        secondaryCta={heroSecondaryCta}
      />

      <HomeProductSection
        title={todaysKitchenTitle}
        products={todaysKitchenProducts as Product[]}
      />

      <HomeCuratedCategoriesSection
        title={curatedTitle}
        categories={curatedCategoriesList as Category[]}
      />

      <HomeProductSection
        title={chefsTableTitle}
        products={chefsTableProducts as Product[]}
      />

      <HomeFeatureSection
        title={smokehouseTitle}
        description={smokehouseDescription}
        imageUrl={smokehouseImage}
        cta={smokehouseCta}
      />

      <HomeFeatureSection
        title={cateringTitle}
        description={cateringDescription}
        imageUrl={cateringImage}
        cta={cateringCta}
      />

      <HomeStandardSection
        title={standardTitle}
        items={standardItems}
      />

      {guestStoriesTitle && guestStoriesData.length > 0 ? (
        <HomeGuestStoriesSection
          title={guestStoriesTitle}
          stories={guestStoriesData}
        />
      ) : null}

      <HomeFinalInvitationSection
        headline={finalInvitationHeadline}
        primaryCta={finalInvitationPrimaryCta}
        secondaryCta={finalInvitationSecondaryCta}
      />

      <Footer />
    </>
  );
}
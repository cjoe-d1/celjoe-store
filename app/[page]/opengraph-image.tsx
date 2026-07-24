import OpengraphImage from "components/opengraph-image";
import { getPageBySlug, getPageMeta } from "lib/supabase/pages";

export default async function Image({ params }: { params: { page: string } }) {
  const page = await getPageBySlug(params.page);
  const title = page ? getPageMeta(page).title : undefined;

  return await OpengraphImage({ title });
}

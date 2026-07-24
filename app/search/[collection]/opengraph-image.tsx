import OpengraphImage from "components/opengraph-image";
import { getCategoryBySlug } from "lib/supabase/categories";

export default async function Image({
  params,
}: {
  params: { collection: string };
}) {
  const category = await getCategoryBySlug(params.collection);
  const title = category?.name;

  return await OpengraphImage({ title });
}

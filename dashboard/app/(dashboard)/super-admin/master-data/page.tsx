import { redirect } from "next/navigation";

/**
 * Master Data parent route. Menu has sub-items (Regions, Locations);
 * redirect to Regions as the default landing.
 */
export default function MasterDataPage() {
  redirect("/super-admin/master-data/regions");
}

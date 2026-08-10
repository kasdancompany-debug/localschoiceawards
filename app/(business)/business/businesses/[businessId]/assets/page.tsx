import ManagedSectionPage from "@/components/businesses/managed-section-page";

type Props = { params: Promise<{ businessId: string }> };

export default function Page({ params }: Props) {
  return (
    <ManagedSectionPage
      params={params}
      section="assets"
      title="Assets"
      description="Upload and manage logos and photos. Media uploads use secure Supabase Storage."
    />
  );
}

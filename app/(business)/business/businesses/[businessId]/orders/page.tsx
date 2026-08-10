import ManagedSectionPage from "@/components/businesses/managed-section-page";

type Props = { params: Promise<{ businessId: string }> };

export default function Page({ params }: Props) {
  return (
    <ManagedSectionPage
      params={params}
      section="orders"
      title="Orders"
      description="Award product and sponsorship orders will appear here in a later phase."
    />
  );
}

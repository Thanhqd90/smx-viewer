import EditViewer from "@/components/viewer/EditViewer";

interface EditPageProps {
  params: Promise<{
    displayId: string;
  }>;
}

export default async function EditPage({ params }: EditPageProps) {
  const { displayId } = await params;

  return <EditViewer displayId={displayId} />;
}

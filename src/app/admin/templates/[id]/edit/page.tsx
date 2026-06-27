import TemplateCustomizerForm from '../../TemplateCustomizerForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTemplatePage({ params }: PageProps) {
  const { id } = await params;

  return (
    <TemplateCustomizerForm
      mode="edit"
      templateId={id}
    />
  );
}

import TemplateCustomizerForm from '../TemplateCustomizerForm';

interface PageProps {
  searchParams: Promise<{ base_template_id?: string }>;
}

export default async function NewTemplatePage({ searchParams }: PageProps) {
  const query = await searchParams;

  return (
    <TemplateCustomizerForm
      mode="new"
      baseTemplateId={query.base_template_id}
    />
  );
}

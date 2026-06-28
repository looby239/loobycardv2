import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { normalizeTemplateConfig, type TemplateConfig } from '@/lib/templateConfig';
import { buildTemplateTestCard, TEST_PLAN_IDS, type TestPlanId } from '@/lib/templateTestMock';
import TemplateTestPreviewFrame from './TemplateTestPreviewFrame';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    template_id?: string | string[];
    plan?: string | string[];
  }>;
}

interface TemplateRecord {
  id: string;
  base_template_key?: string | null;
  config?: TemplateConfig | null;
  is_custom_template?: boolean | null;
  css_override?: string | null;
}

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function isTestPlan(value?: string): value is TestPlanId {
  return TEST_PLAN_IDS.includes(value as TestPlanId);
}

async function getTemplateRecord(templateId: string): Promise<TemplateRecord | null> {
  const [{ data: templateRow }, { data: configRow }] = await Promise.all([
    supabaseAdmin
      .from('templates')
      .select('id,base_template_key,config,is_custom_template')
      .eq('id', templateId)
      .maybeSingle(),
    supabaseAdmin
      .from('template_configs')
      .select('id,base_template_key,config,is_custom_template,css_override')
      .eq('id', templateId)
      .maybeSingle(),
  ]);

  if (!templateRow && !configRow) {
    return null;
  }

  return {
    ...(templateRow || {}),
    ...(configRow || {}),
    id: templateId,
  } as TemplateRecord;
}

export default async function AdminTemplateTestPreviewPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const templateId = firstParam(query.template_id) || 'template-10';
  const plan = firstParam(query.plan);
  const planId = isTestPlan(plan) ? plan : 'basic';

  if (!/^[a-zA-Z0-9_-]+$/.test(templateId)) {
    return notFound();
  }

  const template = await getTemplateRecord(templateId);

  if (!template) {
    return notFound();
  }

  const renderKey = template.base_template_key || templateId;
  const card = buildTemplateTestCard(templateId, planId);
  const templateConfig = template.config
    ? normalizeTemplateConfig(template.config)
    : undefined;

  return (
    <TemplateTestPreviewFrame
      card={card}
      cssOverride={template.css_override || ''}
      templateKey={renderKey}
      templateConfig={templateConfig}
    />
  );
}

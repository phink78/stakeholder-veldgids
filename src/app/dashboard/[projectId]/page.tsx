import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProjectWerkruimte from './ProjectWerkruimte'

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('id, naam, thema')
    .eq('id', projectId)
    .single()

  if (!project) notFound()

  const { data: organisations } = await supabase
    .from('organisations')
    .select('id, naam, type, eigen_agenda, positie_x, positie_y, avg_label, strategie, focus, ai_ingevuld')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  return (
    <ProjectWerkruimte
      project={project}
      initieleOrgs={organisations ?? []}
    />
  )
}

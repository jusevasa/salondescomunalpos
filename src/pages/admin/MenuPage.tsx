import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { MenuAdminDashboard } from '@/features/admin'

type MenuTab = 'resumen' | 'categorias' | 'items' | 'acompanamientos' | 'puntos-de-coccion' | 'estaciones'

export default function AdminMenuPage() {
  const params = useParams<{ tab?: MenuTab }>()
  const navigate = useNavigate()

  const currentTab: MenuTab = (params.tab as MenuTab) ?? 'resumen'

  useEffect(() => {
    if (!params.tab) {
      navigate('/admin/menu/resumen', { replace: true })
    }
  }, [params.tab, navigate])

  return (
    <div className="space-y-6">
      <MenuAdminDashboard initialTab={currentTab} />
    </div>
  )
}
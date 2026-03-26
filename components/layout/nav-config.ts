import { LayoutDashboard, MessageSquare, Users, Settings } from 'lucide-react'

export const navGroups = (orgId: string) => [
  {
    label: 'Overview',
    items: [
      { href: `/${orgId}`, label: 'Dashboard', icon: LayoutDashboard, exact: true as const },
    ],
  },
  {
    label: 'Monitoring',
    items: [
      { href: `/${orgId}/prompts`, label: 'Prompts', icon: MessageSquare, exact: false as const },
      { href: `/${orgId}/competitors`, label: 'Competitors', icon: Users, exact: false as const },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { href: `/${orgId}/settings`, label: 'Settings', icon: Settings, exact: false as const },
    ],
  },
]

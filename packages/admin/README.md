# @kairn/admin

Composants React pour le dashboard d'administration des sites Kairn.

## Installation

```bash
pnpm add @kairn/admin
```

## Composants

### Layout

```tsx
import { AdminLayout, AdminSidebar, AdminHeader } from '@kairn/admin';

export default function AdminPage({ children }) {
  return (
    <AdminLayout>
      <AdminSidebar
        items={[
          { label: 'Dashboard', href: '/admin', icon: 'Home' },
          { label: 'Blog', href: '/admin/blog', icon: 'FileText' },
          { label: 'Analytics', href: '/admin/analytics', icon: 'BarChart' },
        ]}
      />
      <div className="flex-1">
        <AdminHeader title="Dashboard" />
        <main className="p-6">{children}</main>
      </div>
    </AdminLayout>
  );
}
```

### Analytics

```tsx
import {
  StatCard,
  LineChart,
  BarChart,
  AreaChart,
  ConversionFunnel,
  RealTimeVisitors,
} from '@kairn/admin';

export function AnalyticsDashboard({ data }) {
  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Visiteurs" value={data.visitors} change={+12.5} icon="Users" />
        <StatCard title="Pages vues" value={data.pageViews} change={+8.2} icon="Eye" />
      </div>

      <LineChart
        data={data.visitorsTrend}
        xKey="date"
        yKey="visitors"
        title="Évolution des visites"
      />

      <RealTimeVisitors count={data.realtime} />
    </>
  );
}
```

### Blog

```tsx
import {
  BlogPostForm,
  BlogPostList,
  MarkdownEditor,
  ImageSelectionModal,
  ArticleGeneratorModal,
} from '@kairn/admin';

export function BlogAdmin() {
  return (
    <BlogPostList
      posts={posts}
      onEdit={post => router.push(`/admin/blog/edit/${post.slug}`)}
      onDelete={handleDelete}
    />
  );
}

export function BlogEditor({ post }) {
  return (
    <BlogPostForm
      initialData={post}
      onSave={handleSave}
      aiEnabled={true}
      onGenerateArticle={handleGenerate}
    />
  );
}
```

### Social Media

> **Note**: Les composants de gestion des réseaux sociaux ont été déplacés vers les applications individuelles pour une meilleure co-localisation avec les pages refactorisées.
>
> Pour Psypnos, voir : `apps/psypnos/app/admin/social/_components/`
>
> - `SocialCalendar.tsx` - Calendrier de publications
> - `PostsHistory.tsx` - Historique des posts
> - `SocialInsights.tsx` - Analytics et métriques
> - `EditPostModal.tsx` - Modal d'édition de post
> - `PostDetailPanel.tsx` - Panneau de détails

### Common

```tsx
import { DataTable, DateRangePicker, ExportButton, ConfirmDialog, Drawer } from '@kairn/admin';

export function DataManagement() {
  return (
    <>
      <div className="mb-4 flex justify-between">
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <ExportButton data={filteredData} formats={['xlsx', 'csv', 'pdf']} />
      </div>

      <DataTable columns={columns} data={data} pagination sortable searchable />

      <ConfirmDialog
        open={deleteConfirm}
        title="Supprimer ?"
        message="Cette action est irréversible."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(false)}
      />
    </>
  );
}
```

## Hooks

```tsx
import { useAdminAuth, usePagination, useTableSort, useExport } from '@kairn/admin';

// Vérification authentification admin
const { user, isAdmin, logout } = useAdminAuth();

// Pagination
const { page, setPage, pageSize, offset, totalPages } = usePagination({
  total: 100,
  pageSize: 10,
});

// Tri de table
const { sortKey, sortDirection, handleSort, sortedData } = useTableSort(data);

// Export
const { exportToExcel, exportToPdf, isExporting } = useExport();
```

## Types

```typescript
import type {
  AdminUser,
  BlogPostFormData,
  SocialAccount,
  AnalyticsData,
  DateRange,
} from '@kairn/admin';
```

## Dépendances

- `@kairn/ui` - Composants de base
- `@kairn/core` - Utilitaires
- `recharts` - Graphiques
- `xlsx` - Export Excel
- `framer-motion` - Animations

## Licence

MIT

# Changes to apply in Manus AI

## 1. client/src/App.tsx — Add import + route

Add this import near the other page imports:
```tsx
import Leads from './pages/Leads';
```

Add this route alongside the other routes:
```tsx
<Route path={"/leads"} component={Leads} />
```

---

## 2. client/src/pages/Hub.tsx — Add Leads card to TOOLS array

Find the TOOLS array and add this object (keep it with the other admin tools):
```ts
{
  id: 'leads',
  title: 'Leads',
  subtitle: 'Lead Magnet',
  description: 'View and manage leads from the free assessment',
  icon: 'UserPlus',
  href: '/leads',
  color: 'text-emerald-400',
  requiredRole: undefined,
  hiddenFromHub: false,
},
```

Make sure `UserPlus` is included in the lucide-react import at the top of Hub.tsx.

---

## 3. New files to copy into the project

- `client/src/pages/Leads.tsx` → copy to the same path in the project
- `server/leads.test.ts` → copy to the same path in the project

---

## 4. Verify

```bash
npx tsc --noEmit   # should be 0 errors
pnpm test          # all tests should pass
```

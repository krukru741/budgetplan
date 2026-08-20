// app/page.tsx
// Root redirect — sends visitors to login (middleware handles authenticated users → dashboard)
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/login')
}

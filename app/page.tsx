import { redirect } from 'next/navigation';

export default function HomePage() {
  // Le middleware interceptera : s'il n'y a pas de session, il redirigera
  // vers /login avant même que cette redirection ne s'applique.
  redirect('/dashboard');
}

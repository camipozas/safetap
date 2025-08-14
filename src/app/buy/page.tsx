import { auth } from '@/lib/auth';
import CheckoutForm from './ui/CheckoutForm';

export default async function BuyPage() {
  const session = await auth();
  return (
    <div className="grid gap-6 max-w-xl">
      <h1 className="text-2xl font-semibold">Personaliza tu sticker</h1>
      <CheckoutForm userEmail={session?.user?.email ?? ''} />
    </div>
  );
}

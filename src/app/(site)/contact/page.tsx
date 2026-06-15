import { permanentRedirect } from 'next/navigation';

export default function ContactPage() {
  permanentRedirect('/?app=contact');
}

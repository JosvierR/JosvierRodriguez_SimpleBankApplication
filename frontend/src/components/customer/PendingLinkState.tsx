import { Link2 } from 'lucide-react'

export function PendingLinkState() {
  return <section className="pending-link" role="status"><span><Link2 size={24} /></span><div><h1>Bank profile connection pending</h1><p>An administrator needs to connect this login to a bank customer before accounts are available.</p></div></section>
}

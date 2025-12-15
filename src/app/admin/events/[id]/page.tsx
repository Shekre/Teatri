import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import styles from '../../admin.module.css';
import AdminSeatSelectorWrapper from '@/components/AdminSeatSelectorWrapper';

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const event = await prisma.event.findUnique({
        where: { id },
        include: { priceAreas: { orderBy: { priority: 'desc' } } }
    });

    if (!event) return <div>Event not found</div>;

    async function deleteRule(formData: FormData) {
        'use server';
        const ruleId = formData.get('ruleId') as string;
        await prisma.priceArea.delete({ where: { id: ruleId } });
        redirect(`/admin/events/${id}`);
    }

    return (
        <div>
            <div className={styles.header}>
                <h1>Edit Rules: {event.title}</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                {/* Visual Seat Selector */}
                <AdminSeatSelectorWrapper eventId={id} />

                {/* Existing Rules List */}
                <div className={styles.card}>
                    <h2>Existing Pricing Rules</h2>
                    {event.priceAreas.length === 0 ? <p>No rules defined.</p> : (
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {event.priceAreas.map((rule: { id: string; name: string; price: number | null; priority: number; selectors: string }) => (
                                <li key={rule.id} style={{ padding: '1rem', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between' }}>
                                    <div>
                                        <strong>{rule.name}</strong><br />
                                        {rule.price} ALL | Priority: {rule.priority}<br />
                                        <small>{rule.selectors}</small>
                                    </div>
                                    <form action={deleteRule}>
                                        <input type="hidden" name="ruleId" value={rule.id} />
                                        <button type="submit" style={{ background: 'red', color: 'white', border: 'none', padding: '0.5rem' }}>Delete</button>
                                    </form>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

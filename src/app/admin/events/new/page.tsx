import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import styles from '../../admin.module.css';

export default function NewEventPage() {
    async function createEvent(formData: FormData) {
        'use server';

        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const location = formData.get('location') as string;
        const start = formData.get('start') as string;
        const end = formData.get('end') as string;
        const image = formData.get('image') as string;

        await prisma.event.create({
            data: {
                title,
                description,
                location,
                startDate: new Date(start),
                endDate: new Date(end),
                image,
            }
        });

        redirect('/admin/events');
    }

    return (
        <div className={styles.card}>
            <h1>Create New Event</h1>
            <form action={createEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px' }}>
                <label>
                    Title
                    <input name="title" required className={styles.input} style={{ width: '100%', padding: '0.5rem' }} />
                </label>
                <label>
                    Description
                    <textarea name="description" className={styles.input} style={{ width: '100%', padding: '0.5rem' }} />
                </label>
                <label>
                    Image URL
                    <input name="image" className={styles.input} style={{ width: '100%', padding: '0.5rem' }} />
                </label>
                <label>
                    Location
                    <input name="location" defaultValue="TKOB Main Hall" className={styles.input} style={{ width: '100%', padding: '0.5rem' }} />
                </label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <label style={{ flex: 1 }}>
                        Start Date (try 2025-12-25T19:00)
                        <input name="start" type="datetime-local" required className={styles.input} style={{ width: '100%', padding: '0.5rem' }} />
                    </label>
                    <label style={{ flex: 1 }}>
                        End Date
                        <input name="end" type="datetime-local" required className={styles.input} style={{ width: '100%', padding: '0.5rem' }} />
                    </label>
                </div>
                <button type="submit" className={styles.button}>Create Event</button>
            </form>
        </div>
    );
}

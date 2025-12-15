'use client';

import { useTransition, useEffect, useState } from 'react';
import AdminSeatSelector from './AdminSeatSelector';

interface AdminSeatSelectorWrapperProps {
    eventId: string;
}

export default function AdminSeatSelectorWrapper({ eventId }: AdminSeatSelectorWrapperProps) {
    const [isPending, startTransition] = useTransition();
    const [existingRules, setExistingRules] = useState<any[]>([]);
    const [assignedSeats, setAssignedSeats] = useState<string[]>([]);

    // Fetch existing rules on mount
    useEffect(() => {
        fetch(`/api/admin/events/${eventId}/rules`)
            .then(res => res.json())
            .then(data => {
                if (data.rules) {
                    setExistingRules(data.rules);
                    // Extract all assigned seats
                    const allSeats: string[] = [];
                    data.rules.forEach((rule: any) => {
                        try {
                            const selectors = JSON.parse(rule.selectors);
                            if (selectors.seats) {
                                allSeats.push(...selectors.seats);
                            }
                        } catch (e) {
                            console.error('Failed to parse selectors', e);
                        }
                    });
                    setAssignedSeats(allSeats);
                }
            });
    }, [eventId]);


    const handleSaveRule = async (rule: { name: string; seats: string[]; price: number; priority: number }) => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append('name', rule.name);
            formData.append('price', rule.price.toString());
            formData.append('priority', rule.priority.toString());
            formData.append('seats', JSON.stringify(rule.seats));

            await fetch(`/api/admin/events/${eventId}/rules`, {
                method: 'POST',
                body: formData
            });

            window.location.reload();
        });
    };

    return (
        <div>
            {isPending && <div style={{ padding: '1rem', background: '#333', marginBottom: '1rem' }}>Saving rule...</div>}
            <AdminSeatSelector onSaveRule={handleSaveRule} assignedSeats={assignedSeats} />
        </div>
    );
}

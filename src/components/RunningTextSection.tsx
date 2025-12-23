'use client';

import { useEffect, useState } from 'react';
import Marquee from '@/components/Marquee';
import { RunningTextItem, RunningTextData } from '@/types/runningText';

export default function RunningTextSection() {
    const [items, setItems] = useState<RunningTextItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const response = await fetch('/api/running-text');
                if (response.ok) {
                    const data: RunningTextData = await response.json();
                    // Filter only active items and sort by order
                    const activeItems = data.items
                        .filter((item) => item.isActive)
                        .sort((a, b) => a.order - b.order);
                    setItems(activeItems);
                }
            } catch (error) {
                console.error('Failed to fetch running text:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchItems();
    }, []);

    if (loading || items.length === 0) {
        return null;
    }

    return (
        <div className="w-full bg-transparent py-4 overflow-hidden">
            <Marquee
                items={items.map(item => item.text)}
                className="py-2"
                direction="left"
                speed={20}
            />
        </div>
    );
}

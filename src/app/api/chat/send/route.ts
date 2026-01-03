import { NextResponse } from 'next/server';
import { sendTelegramAlert } from '@/lib/telegram';

export async function POST(request: Request) {
    try {
        const { name, contact, message } = await request.json();

        if (!name || !contact || !message) {
            return NextResponse.json({ error: 'Mohon lengkapi semua data' }, { status: 400 });
        }

        // Smart Reply Link Generator
        let replyLink = '';
        let contactType = 'Contact';

        // Check if it's likely a phone number
        const isPhone = /^[0-9+\-\s]+$/.test(contact);
        const hasAt = contact.includes('@');

        if (isPhone) {
            let cleanNumber = contact.replace(/\D/g, '');
            if (cleanNumber.startsWith('0')) {
                cleanNumber = '62' + cleanNumber.substring(1);
            }
            // Default to Indonesia 62 if no prefix
            if (!cleanNumber.startsWith('62') && cleanNumber.length > 5) {
                cleanNumber = '62' + cleanNumber;
            }
            replyLink = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(`Hai ${name}, saya sudah baca pesanmu di website. Boleh kita diskusi?`)}`;
            contactType = 'WhatsApp';
        } else if (hasAt) {
            replyLink = `mailto:${contact}?subject=Re: Pesan dari Website&body=Halo ${name},`;
            contactType = 'Email';
        }

        const tgMessage =
            `💬 **PESAN BARU DARI WEBSITE**

👤 **Nama:** ${name}
📞 **${contactType}:** \`${contact}\`

📝 **Isi Pesan:**
"${message}"

${replyLink ? `👉 [BALAS SEKARANG (${contactType})](${replyLink})` : ''}

⏰ ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;

        await sendTelegramAlert(tgMessage);

        // Save to local JSON (Leads Database)
        try {
            const fs = await import('fs/promises');
            const path = await import('path');
            const leadsFile = path.join(process.cwd(), 'src/data/leads.json');

            let leadsData = { leads: [] };
            try {
                const fileContent = await fs.readFile(leadsFile, 'utf-8');
                leadsData = JSON.parse(fileContent);
            } catch (e) {
                // File might not exist or be empty, use default
            }

            // @ts-ignore
            leadsData.leads.unshift({
                id: `lead-${Date.now()}`,
                name,
                contact,
                contactType,
                message,
                createdAt: new Date().toISOString(),
                status: 'new'
            });

            await fs.writeFile(leadsFile, JSON.stringify(leadsData, null, 2));
        } catch (saveError) {
            console.error('Failed to save lead locally:', saveError);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Chat error:', error);
        return NextResponse.json({ error: 'Gagal mengirim pesan' }, { status: 500 });
    }
}

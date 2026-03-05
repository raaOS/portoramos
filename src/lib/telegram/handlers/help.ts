/**
 * /help command handler
 */

import type { MessageToSend } from '../types';

export function handleHelpCommand(): MessageToSend[] {
    return [{
        text: '🛠 *Admin Commands*\n\n' +
            '`/resume [detail]` - AI bikin Resume ATS (PDF) + Pesan HRD\n' +
            '`/prop [detail]` - AI bikin Proposal Lamaran\n' +
            '`/leads` - Cek 5 pesan terakhir\n' +
            '`/help` - Tampilkan menu ini\n' +
            '`/ai` - Aktifkan ulang AI Auto-Responder'
    }];
}

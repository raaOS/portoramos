const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(process.cwd(), 'src/data/testimonial.json');

const testimonials = [
    {
        id: 1,
        name: "Rekan di PT. Bitlabs Academy",
        role: "Senior Designer",
        company: "PT. Bitlabs Academy",
        content: "Jujurly, kerja bareng Ramos tuh vibes-nya asik parah! Skill desainnya no debat, selalu on point dan estetik abis. Dia juga cepet banget nangkep brief, jadi revisi minim banget. Pokoknya slay!",
        rating: 5,
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bitlabs"
    },
    {
        id: 2,
        name: "Student di Sekolah Desain",
        role: "Mentee",
        company: "Sekolah Desain",
        content: "Kak Ramos ngajarnya chill banget tapi daging semua materinya. Gak pelit ilmu dan sabar banget ngadepin kita yang masih newbie. Valid no debat, mentor ter-best!",
        rating: 5,
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Student"
    },
    {
        id: 3,
        name: "Manager di PT. Duta Mode",
        role: "Marketing Manager",
        company: "PT. Duta Mode",
        content: "Visual yang dibikin Ramos bener-bener bikin brand kita stand out. Dia ngerti banget selera pasar zaman now. Kerjanya sat-set tapi hasilnya tetep premium. Approved!",
        rating: 5,
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=DutaMode"
    },
    {
        id: 4,
        name: "Owner Sthal.Co",
        role: "Owner",
        company: "Sthal.Co",
        content: "Ramos tuh multitalenta banget! Gak cuma jago desain kaos yang hypebeast, tapi juga rapi banget ngurus admin. Bener-bener definisi karyawan idaman yang beyond expectation.",
        rating: 5,
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sthal"
    },
    {
        id: 5,
        name: "Supervisor Starbucks",
        role: "Store Manager",
        company: "PT Sari Coffee Indonesia",
        content: "Customer service skill-nya Ramos tuh next level. Dia bisa bikin customer happy cuma gara-gara ngobrolin kopi. Energinya positif banget, bikin shift pagi jadi gak ngantuk!",
        rating: 5,
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Starbucks"
    },
    {
        id: 6,
        name: "Owner Wulan Boutique",
        role: "Owner",
        company: "Wulan Boutique",
        content: "Desain feed IG yang dibikin Ramos bikin olshop aku jadi aesthetic parah. Penjualan naik gara-gara visualnya eye-catching. Fix bakal hire lagi sih kalo ada project baru.",
        rating: 5,
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Wulan"
    }
];

const data = {
    testimonials,
    lastUpdated: new Date().toISOString()
};

// Ensure directory exists
const dir = path.dirname(dataFilePath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));

console.log('✅ Gen Z Testimonials seeded successfully!');
console.log(`📍 File created at: ${dataFilePath}`);

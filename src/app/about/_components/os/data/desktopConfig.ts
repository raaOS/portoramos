import { User, ArrowLeft, Grid, Smile, Rocket, Mail, Trash2, MessageCircle, FileText, Image as ImageIcon, MessageSquare, StickyNote } from "lucide-react";

export const desktopApps = [
    { id: "about", label: "About Me", icon: User, color: "bg-blue-500" },
    { id: "projects", label: "Projects", icon: Rocket, color: "bg-orange-500" },
    { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "bg-green-500" },
    { id: "trash-bin", label: "Trash", icon: Trash2, color: "bg-gray-500" },
];

export const dockItemsConfig = [
    { id: "about", label: "About", icon: User },
    { id: "projects", label: "Projects", icon: Rocket },
    { id: "whatsapp", label: "Chat", icon: MessageCircle },
    { id: "notes", label: "Notes", icon: StickyNote },
    { id: "trash-bin", label: "Trash", icon: Trash2 },
];

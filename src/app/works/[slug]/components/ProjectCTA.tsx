'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function ProjectCTA() {
    return (
        <section className="py-16 md:py-24 bg-gray-50 dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800">
            <div className="container px-4 mx-auto text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="max-w-2xl mx-auto space-y-6"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold uppercase tracking-wide">
                        <Sparkles size={14} />
                        <span>Ready to Collaborate?</span>
                    </div>

                    <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                        Let's build something <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">extraordinary together.</span>
                    </h2>

                    <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                        Suka dengan hasil project ini? Saya bisa membantu brand Anda mencapai standar visual yang sama. Mari diskusikan ide Anda.
                    </p>

                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/contact"
                            className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white transition-all duration-200 bg-black rounded-full hover:bg-gray-800 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
                        >
                            Start a Project
                            <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                        </Link>

                        <Link
                            href="/cv"
                            className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-gray-700 transition-all duration-200 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:text-gray-900 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
                        >
                            View Full Resume
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

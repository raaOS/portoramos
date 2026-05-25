'use client';

import { Link } from 'next-view-transitions';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function ProjectCTA() {
  return (
    <section className="border-t border-gray-100 bg-gray-50 py-16 dark:border-zinc-800 dark:bg-zinc-900 md:py-24">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl space-y-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            <Sparkles size={14} />
            <span>Ready to Collaborate?</span>
          </div>

          <h2 className="text-3xl font-bold leading-tight text-gray-900 dark:text-white md:text-5xl">
            Let&apos;s build something <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              extraordinary together.
            </span>
          </h2>

          <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-400">
            Suka dengan hasil project ini? Saya bisa membantu brand Anda mencapai standar visual
            yang sama. Mari diskusikan ide Anda.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
            <Link
              href="/contact"
              className="group relative inline-flex items-center justify-center rounded-full bg-black px-8 py-4 text-base font-bold text-white transition-all duration-200 hover:scale-105 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 active:scale-95"
            >
              Start a Project
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/cv"
              className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-8 py-4 text-base font-bold text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 active:scale-95"
            >
              View Full Resume
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

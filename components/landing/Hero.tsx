"use client";

import { Button } from "@/components/ui/button";
import { Zap, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-16 md:pt-24 lg:pt-32 pb-24">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />

      <div className="container relative mx-auto px-4 text-center">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary border border-primary/20 backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              AI-Powered Cooking Assistant
            </div>
          </motion.div>

          {/* Hero Title with Gradient */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl font-black tracking-tight sm:text-7xl"
          >
            Your Kitchen,{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient background-size-200">
              Smarter
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl sm:text-2xl text-muted-foreground leading-relaxed max-w-2xl mx-auto"
          >
            Manage your pantry, discover recipes, and never waste food again.
            Powered by AI to help you make the most of what you have.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row justify-center gap-4 pt-6"
          >
            <Button
              size="lg"
              asChild
              className="text-base h-12 px-8 shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Link href="/sign-up">
                <Zap className="mr-2 h-5 w-5" />
                Start Cooking Smarter
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="text-base h-12 px-8 hover:scale-105 transition-all border-2"
            >
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

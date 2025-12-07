"use client";

import { Package, BookOpen, Sparkles, ChefHat, Camera } from "lucide-react";
import { motion } from "framer-motion";

const features = [
    {
        icon: Package,
        title: "Pantry Tracking",
        description:
            "Keep track of what you have at home, including quantities and expiration dates. Never forget what's in your fridge.",
        color: "text-primary",
        bg: "from-primary/20 to-primary/5",
        hoverBg: "group-hover:from-primary/30 group-hover:to-primary/10",
        border: "hover:border-primary/50",
    },
    {
        icon: BookOpen,
        title: "Recipe Management",
        description:
            "Upload recipe photos and let AI extract all the details for you. Build your personal cookbook effortlessly.",
        color: "text-accent",
        bg: "from-accent/20 to-accent/5",
        hoverBg: "group-hover:from-accent/30 group-hover:to-accent/10",
        border: "hover:border-accent/50",
    },
    {
        icon: Sparkles,
        title: "Smart Suggestions",
        description:
            "Get AI-powered recipe suggestions based on what you already have. Make the most of your ingredients.",
        color: "text-success",
        bg: "from-success/20 to-success/5",
        hoverBg: "group-hover:from-success/30 group-hover:to-success/10",
        border: "hover:border-success/50",
    },
    {
        icon: ChefHat,
        title: "Shopping Lists",
        description:
            "Automatically generate shopping lists based on recipes you want to make. Never miss an ingredient.",
        color: "text-warning",
        bg: "from-warning/20 to-warning/5",
        hoverBg: "group-hover:from-warning/30 group-hover:to-warning/10",
        border: "hover:border-warning/50",
    },
];

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

export function Features() {
    return (
        <section className="border-t bg-gradient-to-b from-muted/30 to-background py-24">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16 space-y-4">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-4xl font-bold tracking-tight"
                    >
                        Everything you need to cook smarter
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-lg text-muted-foreground max-w-2xl mx-auto"
                    >
                        AI-powered features that make managing your kitchen effortless
                    </motion.p>
                </div>

                {/* Feature Pills */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex flex-wrap justify-center gap-3 mb-16"
                >
                    <div className="flex items-center gap-2 rounded-full bg-card border px-4 py-2 text-sm shadow-sm hover:shadow-md transition-all">
                        <Camera className="h-4 w-4 text-primary" />
                        <span className="font-medium">Receipt Scanning</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-card border px-4 py-2 text-sm shadow-sm hover:shadow-md transition-all">
                        <Sparkles className="h-4 w-4 text-accent" />
                        <span className="font-medium">AI Recipe Search</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-card border px-4 py-2 text-sm shadow-sm hover:shadow-md transition-all">
                        <Package className="h-4 w-4 text-success" />
                        <span className="font-medium">Smart Expiration Tracking</span>
                    </div>
                </motion.div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    className="grid gap-8 md:grid-cols-2 lg:grid-cols-4"
                >
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            variants={item}
                            className={`group flex flex-col items-center text-center space-y-4 p-6 rounded-xl bg-card border ${feature.border} hover:shadow-lg transition-all hover:scale-105 duration-300`}
                        >
                            <div
                                className={`rounded-full bg-gradient-to-br ${feature.bg} p-5 ${feature.hoverBg} transition-all duration-300`}
                            >
                                <feature.icon className={`h-8 w-8 ${feature.color}`} />
                            </div>
                            <h3 className="font-bold text-xl">{feature.title}</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

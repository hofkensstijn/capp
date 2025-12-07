"use client";

import { Button } from "@/components/ui/button";
import { ChefHat } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function Header() {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                isScrolled
                    ? "bg-background/80 backdrop-blur-md border-b shadow-sm py-2"
                    : "bg-transparent py-4"
            )}
        >
            <div className="container mx-auto flex h-16 items-center px-4">
                <div className="flex items-center gap-2 font-bold text-xl">
                    <div className="bg-primary/10 p-2 rounded-lg">
                        <ChefHat className="h-6 w-6 text-primary" />
                    </div>
                    <span>Capp</span>
                </div>
                <div className="ml-auto flex gap-2">
                    <Button variant="ghost" asChild>
                        <Link href="/sign-in">Sign In</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/sign-up">Get Started</Link>
                    </Button>
                </div>
            </div>
        </header>
    );
}

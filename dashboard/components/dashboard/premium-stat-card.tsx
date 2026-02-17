"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumStatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  gradient?: string;
  textColor?: string;
  delay?: number;
  animateCount?: boolean;
  className?: string;
}

export function PremiumStatCard({
  title,
  value,
  icon: Icon,
  gradient = "from-[#678d3d] to-[#8ab35c]",
  textColor = "text-white",
  delay = 0,
  animateCount = true,
  className,
}: PremiumStatCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [displayValue, setDisplayValue] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay * 1000);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [delay]);

  useEffect(() => {
    if (!isVisible || !animateCount || typeof value !== "number") {
      setDisplayValue(typeof value === "number" ? value : 0);
      return;
    }

    const numericValue = typeof value === "number" ? value : parseFloat(String(value).replace(/,/g, "")) || 0;
    const duration = 1500;
    const steps = 60;
    const increment = numericValue / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current += increment;
      if (step >= steps) {
        setDisplayValue(numericValue);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isVisible, value, animateCount]);

  const formattedValue = typeof value === "number" 
    ? displayValue.toLocaleString() 
    : value;

  return (
    <Card
      ref={cardRef}
      className={cn(
        "cursor-pointer border-0 overflow-hidden transition-all duration-300",
        "hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02]",
        "card-hover-lift",
        className
      )}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
        transition: `all 0.5s ease-out ${delay}s`,
      }}
    >
      <CardContent
        className={cn(
          "p-5 lg:p-6 bg-gradient-to-br",
          gradient,
          textColor
        )}
      >
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              "w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center",
              "bg-white/25 backdrop-blur-sm transition-transform duration-300",
              "hover:scale-110 hover:bg-white/35"
            )}
            style={{
              animation: isVisible ? "pulse-glow 2s infinite" : "none",
            }}
          >
            <Icon className="w-6 h-6 lg:w-7 lg:h-7" />
          </div>
        </div>
        <div className="ml-3 lg:ml-4">
          <p
            className={cn(
              "text-3xl lg:text-4xl font-extrabold mb-1 transition-all duration-300",
              "animate-count-up"
            )}
            style={{
              animation: isVisible ? "countUp 0.6s ease-out" : "none",
            }}
          >
            {formattedValue}
          </p>
          <p className={cn("text-sm lg:text-base font-semibold opacity-90")}>
            {title}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}


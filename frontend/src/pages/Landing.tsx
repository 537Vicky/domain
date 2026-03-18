import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, RefreshCw, Bell } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground animate-fade-in">
              <Shield className="h-3.5 w-3.5 text-primary" />
              Enterprise-grade renewal management
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl animate-fade-in [animation-delay:100ms] opacity-0">
              Never miss a renewal
              <br />
              <span className="gradient-text">again.</span>
            </h1>
            <p className="mb-10 text-lg text-muted-foreground sm:text-xl animate-fade-in [animation-delay:200ms] opacity-0">
              Track all your licenses, domains and subscriptions in one place. Get smart alerts before they expire.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center animate-fade-in [animation-delay:300ms] opacity-0">
              <Link to="/register">
                <Button size="lg" className="gap-2 px-8">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="px-8">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-secondary/30 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              Everything you need
            </h2>
            <p className="text-muted-foreground sm:text-lg">
              A complete toolkit for managing renewals at scale.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Bell,
                title: "Smart Alerts",
                desc: "Color-coded urgency levels keep you informed at a glance. Never be caught off guard.",
              },
              {
                icon: RefreshCw,
                title: "One-Click Renewal",
                desc: "Renew any license or domain instantly with flexible period options.",
              },
              {
                icon: Shield,
                title: "Unified Dashboard",
                desc: "All your licenses and domains organized by urgency in a clean, enterprise interface.",
              },
            ].map((f, i) => (
              <div
                key={f.title}
                className="glass-card hover-lift p-8 animate-fade-in-up opacity-0"
                style={{ animationDelay: `${i * 100 + 100}ms` }}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            Ready to take control?
          </h2>
          <p className="mb-8 text-muted-foreground sm:text-lg">
            Join teams who trust RenewX to manage their critical renewals.
          </p>
          <Link to="/register">
            <Button size="lg" className="gap-2 px-8">
              Start for Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">RenewX</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} RenewX. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

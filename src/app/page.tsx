"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ServerOff, Zap, Globe, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";

interface Quote {
  content: string;
  author: string;
}

export default function Home() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchQuote = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://api.quotable.io/random');
      if (!response.ok) {
        throw new Error('Failed to fetch quote');
      }
      const data = await response.json();
      setQuote({ content: data.content, author: data.author });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch a new quote. Please try again later.",
      })
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <ServerOff className="h-10 w-10 text-primary" />,
      title: 'Backend Elimination',
      description: 'The entire application is rendered on the client-side, removing the need for a traditional server backend.',
    },
    {
      icon: <Zap className="h-10 w-10 text-primary" />,
      title: 'Client-Side Optimization',
      description: 'Leveraging modern browser capabilities to deliver a fast, responsive, and interactive user experience.',
    },
    {
      icon: <Globe className="h-10 w-10 text-primary" />,
      title: 'API Dependency',
      description: 'Functionality is powered by browser APIs and third-party services, all called directly from the client.',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <section className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
          Serverless Starter
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Build Modern Web Apps Without a Backend. This starter kit demonstrates a purely client-side rendered application using Next.js.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button size="lg">Get Started</Button>
          <Button size="lg" variant="outline">Learn More</Button>
        </div>
      </section>

      <section className="mt-20">
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="text-center">
              <CardHeader>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  {feature.icon}
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                <CardDescription className="mt-2">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-20">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>Live API Demo</CardTitle>
            <CardDescription>
              This is an example of fetching data from a third-party API on the client-side.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="min-h-[120px] rounded-md border border-dashed p-6">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="mt-2 h-4 w-1/4" />
                </div>
              ) : quote ? (
                <blockquote className="space-y-2">
                  <p className="text-lg font-medium">&ldquo;{quote.content}&rdquo;</p>
                  <footer className="text-sm text-muted-foreground">- {quote.author}</footer>
                </blockquote>
              ) : (
                <p className="text-center text-muted-foreground">Click the button to fetch a quote!</p>
              )}
            </div>
            <Button onClick={fetchQuote} disabled={isLoading} className="mt-4 w-full">
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Fetching...' : 'Fetch New Quote'}
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

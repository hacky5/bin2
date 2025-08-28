"use client";

export default function Footer() {
  return (
    <footer className="py-6 md:px-8 md:py-0">
      <div className="container flex flex-col items-center justify-center gap-4 md:h-24 md:flex-row">
        <p className="text-balance text-center text-sm leading-loose text-muted-foreground">
          Built with Next.js. Styled with Tailwind CSS & ShadCN UI.
        </p>
      </div>
    </footer>
  );
}

import { c as createComponent, a as createAstro, b as addAttribute, e as renderHead, f as renderSlot, r as renderTemplate } from './astro/server_B-ZIt8ph.mjs';
import 'kleur/colors';
import 'clsx';
/* empty css                          */

const $$Astro = createAstro();
const $$LayoutEn = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$LayoutEn;
  const { title = "DomainFlow", description = "Domain monitoring platform" } = Astro2.props;
  return renderTemplate`<html lang="en"> <head><meta charset="UTF-8"><meta name="description"${addAttribute(description, "content")}><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><title>${title}</title>${renderHead()}</head> <body> <div class="min-h-screen bg-background font-sans antialiased"> <header class="border-b"> <div class="container mx-auto px-4 py-4"> <div class="flex items-center justify-between"> <div class="flex items-center space-x-4"> <h1 class="text-2xl font-bold text-primary">DomainFlow</h1> <span class="text-sm text-muted-foreground">Domain Monitoring Platform</span> </div> <!-- Navigation Menu --> <nav class="hidden md:flex items-center space-x-6"> <a href="/en" class="text-sm hover:text-primary transition-colors font-medium">
🏠 Domain List
</a> <a href="/en/groups" class="text-sm hover:text-primary transition-colors font-medium">
📁 Group Management
</a> </nav> <div class="flex items-center space-x-4"> <!-- Theme toggle --> <div id="theme-toggle-en"></div> <!-- Language switcher --> <div class="flex items-center space-x-2"> <a href="/" class="text-sm hover:text-primary">中文</a> <span class="text-muted-foreground">|</span> <a href="/en" class="text-sm hover:text-primary">English</a> </div> </div> </div> </div> </header> <main class="container mx-auto px-4 py-8"> ${renderSlot($$result, $$slots["default"])} </main> <footer class="border-t mt-auto"> <div class="container mx-auto px-4 py-6"> <div class="text-center text-sm text-muted-foreground"> <p>&copy; 2024 DomainFlow. Professional domain monitoring solution.</p> </div> </div> </footer> </div> </body></html>`;
}, "/home/ivmm/domain/src/layouts/LayoutEn.astro", void 0);

export { $$LayoutEn as $ };

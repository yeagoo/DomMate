import { c as createComponent, a as createAstro, e as renderHead, f as renderSlot, r as renderTemplate } from './astro/server_B-ZIt8ph.mjs';
import 'kleur/colors';
import 'clsx';
/* empty css                          */

const $$Astro = createAstro();
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  const { title = "DomainFlow", description = "\u57DF\u540D\u5230\u671F\u76D1\u63A7\u5E73\u53F0" } = Astro2.props;
  return renderTemplate`<html lang="zh-CN" data-astro-cid-sckkx6r4> <head><meta charset="UTF-8"><meta name="description" content="域名到期监控平台"><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><title>${Astro2.props.title || "DomainFlow - \u57DF\u540D\u76D1\u63A7\u5E73\u53F0"}</title>${renderHead()}</head> <body data-astro-cid-sckkx6r4> <div class="min-h-screen bg-background font-sans antialiased" data-astro-cid-sckkx6r4> <header class="border-b" data-astro-cid-sckkx6r4> <div class="container mx-auto px-4 py-4" data-astro-cid-sckkx6r4> <div class="flex items-center justify-between" data-astro-cid-sckkx6r4> <div class="flex items-center space-x-4" data-astro-cid-sckkx6r4> <h1 class="text-2xl font-bold text-primary" data-astro-cid-sckkx6r4>DomainFlow</h1> <span class="text-sm text-muted-foreground" data-astro-cid-sckkx6r4>域名监控平台</span> </div> <!-- 导航菜单 --> <nav class="hidden md:flex items-center space-x-6" data-astro-cid-sckkx6r4> <a href="/" class="text-sm hover:text-primary transition-colors font-medium" data-astro-cid-sckkx6r4>
🏠 域名列表
</a> <a href="/groups" class="text-sm hover:text-primary transition-colors font-medium" data-astro-cid-sckkx6r4>
📁 分组管理
</a> </nav> <div class="flex items-center space-x-4" data-astro-cid-sckkx6r4> <!-- 主题切换器 --> <div id="theme-toggle" data-astro-cid-sckkx6r4></div> <!-- 语言切换器 --> <div class="flex items-center space-x-2" data-astro-cid-sckkx6r4> <a href="/" class="text-sm hover:text-primary" data-astro-cid-sckkx6r4>中文</a> <span class="text-muted-foreground" data-astro-cid-sckkx6r4>|</span> <a href="/en" class="text-sm hover:text-primary" data-astro-cid-sckkx6r4>English</a> </div> </div> </div> </div> </header> <main class="container mx-auto px-4 py-8" data-astro-cid-sckkx6r4> ${renderSlot($$result, $$slots["default"])} </main> <footer class="border-t mt-auto" data-astro-cid-sckkx6r4> <div class="container mx-auto px-4 py-6" data-astro-cid-sckkx6r4> <div class="text-center text-sm text-muted-foreground" data-astro-cid-sckkx6r4> <p data-astro-cid-sckkx6r4>&copy; 2024 DomainFlow. 专业的域名监控解决方案.</p> </div> </div> </footer> </div> </body></html>`;
}, "/home/ivmm/domain/src/layouts/Layout.astro", void 0);

export { $$Layout as $ };

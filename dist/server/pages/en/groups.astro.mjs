import { c as createComponent, d as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_B-ZIt8ph.mjs';
import 'kleur/colors';
import { $ as $$LayoutEn } from '../../chunks/LayoutEn_PX-ZJiKS.mjs';
import { G as GroupManagement } from '../../chunks/GroupManagement_jKYxQgzS.mjs';
export { renderers } from '../../renderers.mjs';

const $$Groups = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "LayoutEn", $$LayoutEn, { "title": "Group Management - DomMate" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="space-y-6"> ${renderComponent($$result2, "GroupManagement", GroupManagement, { "client:load": true, "language": "en", "client:component-hydration": "load", "client:component-path": "/home/ivmm/domain/src/components/GroupManagement.tsx", "client:component-export": "GroupManagement" })} </div> ` })} `;
}, "/home/ivmm/domain/src/pages/en/groups.astro", void 0);

const $$file = "/home/ivmm/domain/src/pages/en/groups.astro";
const $$url = "/en/groups";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Groups,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };

import { c as createComponent, d as renderComponent, r as renderTemplate } from '../chunks/astro/server_B-ZIt8ph.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_DIRIcJJx.mjs';
import { G as GroupManagement } from '../chunks/GroupManagement_CAhBrP9M.mjs';
export { renderers } from '../renderers.mjs';

const $$Groups = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "\u5206\u7EC4\u7BA1\u7406 - DomainFlow" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "GroupManagement", GroupManagement, { "client:load": true, "language": "zh", "client:component-hydration": "load", "client:component-path": "/home/ivmm/domain/src/components/GroupManagement.tsx", "client:component-export": "GroupManagement" })} ` })}`;
}, "/home/ivmm/domain/src/pages/groups.astro", void 0);

const $$file = "/home/ivmm/domain/src/pages/groups.astro";
const $$url = "/groups";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Groups,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };

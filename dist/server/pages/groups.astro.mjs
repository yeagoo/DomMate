import { c as createComponent, d as renderComponent, r as renderTemplate } from '../chunks/astro/server_B-ZIt8ph.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_BH0Ldx9t.mjs';
import { jsx } from 'react/jsx-runtime';
import 'react';
import { A as AuthWrapper } from '../chunks/AuthWrapper_DS0O-dGF.mjs';
import { G as GroupManagement } from '../chunks/GroupManagement_jKYxQgzS.mjs';
export { renderers } from '../renderers.mjs';

const GroupManagementWithAuth = ({ language = "zh" }) => {
  return /* @__PURE__ */ jsx(AuthWrapper, { language, children: /* @__PURE__ */ jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsx(GroupManagement, { language }) }) });
};

const $$Groups = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "\u5206\u7EC4\u7BA1\u7406 - DomMate" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "GroupManagementWithAuth", GroupManagementWithAuth, { "client:load": true, "language": "zh", "client:component-hydration": "load", "client:component-path": "/home/ivmm/domain/src/components/GroupManagementWithAuth.tsx", "client:component-export": "default" })} ` })} `;
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

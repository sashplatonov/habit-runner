import { g as derived, i as store_get, u as unsubscribe_stores } from "../../../../../../chunks/root.js";
import { A as AddEditHabit } from "../../../../../../chunks/AddEditHabit.js";
import { p as page } from "../../../../../../chunks/stores.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    const habitId = derived(() => store_get($$store_subs ??= {}, "$page", page).params.id);
    AddEditHabit($$renderer2, { editId: habitId() });
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};

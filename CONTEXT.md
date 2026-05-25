# Menu Bar Search Context

## Domain Terms

**Menu Bar Catalog**

The current set of menu bar items that macOS exposes through Accessibility. It is dynamic and may change when apps start, quit, reorder their status items, or when the menu bar becomes crowded.

The catalog is product-facing: it should include items that currently have an Accessibility menu bar element with a screen position. Some of those items may be hidden behind the camera housing or otherwise lack a physical click point; they still belong in the catalog so the user can try their Accessibility action. Items without any current screen position are excluded as stale or non-menu-bar AX artifacts.

**Menu Bar Item**

A single selectable status item or system extra in the menu bar. The extension treats it as a semantic item with owner metadata, title, category, frame, actions, and source.

**Element Hint**

The stable facts Raycast sends back to the helper when opening an item. It is used to re-resolve the current Accessibility element because menu bar frames and item identities can change after the list was loaded.

Element Hint matching must prefer stable owner, title, and Semantic Category facts over frame proximity. Frame and source are hints, not identity, because menu bar items can shift or move between Accessibility sources while Raycast still holds an older list row.

If a hint carries a strong identity signal, the helper must not fall back to a nearby same-owner item when that signal disappears. System categories, input-method categories, and non-empty titles represent the user's intended item; when they no longer match the current Accessibility tree, the row is stale and the UI should refresh the catalog instead of opening a neighbor. Weak frame/source matching is reserved for unlabeled generic app status items where no stronger identity exists.

**Semantic Category**

The product meaning of a menu bar item, such as input method, Wi-Fi, Bluetooth, Sound, Clock, or generic app item. The Swift helper owns semantic category detection; the Raycast UI only presents it.

**Open Attempt**

The helper's attempt to open a current menu bar item. It may use Accessibility actions, a physical coordinate click, or a fallback order chosen from item category and menu bar geometry.

**Menu Bar Opening**

The Raycast-side action of opening a selected Menu Bar Item. It keeps the product response to stale items, helper failures, and local System Events fallbacks out of the command UI.

**Open Policy**

The helper's product rule for choosing an Open Attempt order. It concentrates compatibility decisions for system items, input-method items, ordinary app items, and items hidden behind the camera housing so the command flow can execute the policy without knowing those edge cases.

For third-party app items, physical clicking is the primary open path because many apps expose incomplete Accessibility actions. Accessibility actions must return success before an Open Attempt treats them as successful; merely attempting an action is not enough.

For input-method items, visible menu bar items are opened with a single physical click first. TextInputMenuAgent can report an accepted Accessibility action without opening its chooser, and repeated click variants can accidentally toggle the menu closed again.

For visible Control Center-owned system items, a successful Accessibility action is trusted. Some system extras such as Clock open a panel that the helper cannot reliably observe from the original menu bar click point; following that successful AX action with a physical click can immediately close the panel again. A single physical click is reserved for cases where the Accessibility action itself fails.

For items hidden behind the camera housing with no physical click point, an attempted Accessibility action is treated as success even when macOS returns a non-success code. These status items have no physical fallback path, and some apps open their menu while returning an unreliable AX result. Visible items still require a detected menu, panel, window change, or a trusted successful result so AX false positives do not look successful.

**Debug Snapshot**

A structured diagnostic payload for one menu bar item, including category, owner, frame, click point, Accessibility actions, and labels.

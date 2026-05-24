# Naming Decision

# Final Name

**Menu Bar Search**

The extension's core promise is: search the current macOS menu bar from Raycast and open the selected status item or system extra.

## Best Candidates

1. **Menu Bar Search**
   - Clear, short, and highly searchable.
   - Works well with a command named `Search Menu Bar Items`.
   - Best balance of user language and Raycast Store clarity.

2. **Menu Bar Items**
   - Precise and plain.
   - Reads like a system utility, but feels a little passive.

3. **Menu Bar Extras**
   - Matches Apple's System Settings language.
   - Slightly less obvious to users who think in terms of icons.

4. **Status Item Search**
   - Technically accurate for app status items.
   - Less friendly, and misses system extras in the user's mental model.

5. **Menu Bar Launcher**
   - Communicates action well.
   - Slightly overpromises because the extension opens existing menu bar items rather than launching apps.

## Names to Avoid

- **Selector-style names**: "selector" sounds like a design tool, while the extension opens menus.
- **Menu Bar Controller**: implies deeper control than the extension can safely provide through Accessibility.
- **Status Bar Search**: "status bar" is common in other platforms, but macOS users say menu bar.
- **Menulet**: cute, but not searchable and not self-explanatory.

## Manifest Shape

Use:

- `name`: `menu-bar-search`
- `title`: `Menu Bar Search`
- command `title`: `Search Menu Bar Items`
- `description`: `Search and open macOS menu bar items from Raycast.`

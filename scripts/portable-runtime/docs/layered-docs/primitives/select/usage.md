## Usage Guidelines

- **Give the root a position for form validation.** A required Select blocks form submission while it has no value. The browser shows its message next to the trigger and moves focus to the trigger. Give the Select root a position, such as `position: relative`, so the message appears at the trigger inside scroll containers. The styled Select already does this.

## Positioning

Select positions its popup from the trigger. Keep the `Positioner` and `Popup` parts near the trigger in source order so the relationship stays readable, then let the Runtime handle placement, collision, and open-state updates after hydration.

## Examples

::example{id="positioned-select"}

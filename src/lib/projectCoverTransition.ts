export const PROJECT_COVER_TRANSITION_NAME = 'project-cover';
export const PROJECT_COVER_TRANSITION_ATTRIBUTE = 'data-project-cover-transition';

const PROJECT_COVER_SELECTOR = `[${PROJECT_COVER_TRANSITION_ATTRIBUTE}]`;

/**
 * A view-transition-name must be unique within each captured DOM state.
 * Clear stale participants before assigning the clicked project cover.
 */
export function prepareProjectCoverTransition(target: HTMLElement): void {
  if (typeof document === 'undefined') return;

  document.querySelectorAll<HTMLElement>(PROJECT_COVER_SELECTOR).forEach((element) => {
    if (element !== target) {
      element.style.removeProperty('view-transition-name');
    }
  });

  target.style.setProperty('view-transition-name', PROJECT_COVER_TRANSITION_NAME);
}

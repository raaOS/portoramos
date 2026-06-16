import { afterEach, describe, expect, it } from 'vitest';
import {
  prepareProjectCoverTransition,
  PROJECT_COVER_TRANSITION_ATTRIBUTE,
  PROJECT_COVER_TRANSITION_NAME,
} from '../projectCoverTransition';

afterEach(() => {
  document.body.replaceChildren();
});

describe('prepareProjectCoverTransition', () => {
  it('keeps the project cover transition name on exactly one participant', () => {
    const previousTarget = document.createElement('div');
    const nextTarget = document.createElement('div');

    previousTarget.setAttribute(PROJECT_COVER_TRANSITION_ATTRIBUTE, '');
    nextTarget.setAttribute(PROJECT_COVER_TRANSITION_ATTRIBUTE, '');
    previousTarget.style.setProperty('view-transition-name', PROJECT_COVER_TRANSITION_NAME);
    document.body.append(previousTarget, nextTarget);

    prepareProjectCoverTransition(nextTarget);

    expect(previousTarget.style.getPropertyValue('view-transition-name')).toBe('');
    expect(nextTarget.style.getPropertyValue('view-transition-name')).toBe(
      PROJECT_COVER_TRANSITION_NAME
    );
  });

  it('does not alter elements outside the project cover transition', () => {
    const unrelated = document.createElement('div');
    const target = document.createElement('div');

    unrelated.style.setProperty('view-transition-name', 'site-header');
    target.setAttribute(PROJECT_COVER_TRANSITION_ATTRIBUTE, '');
    document.body.append(unrelated, target);

    prepareProjectCoverTransition(target);

    expect(unrelated.style.getPropertyValue('view-transition-name')).toBe('site-header');
  });
});

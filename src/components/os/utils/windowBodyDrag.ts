import type React from 'react';

const BODY_DRAG_BLOCK_SELECTOR = [
  'a',
  'button',
  'input',
  'textarea',
  'select',
  'option',
  'label',
  'summary',
  'details',
  'iframe',
  'video',
  'audio',
  'canvas',
  'svg',
  'img',
  '[contenteditable="true"]',
  '[draggable="true"]',
  '[data-no-window-drag]',
  '[data-testid^="window-resize-"]',
  '[role="button"]',
  '[role="link"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  '[role="slider"]',
  '[role="spinbutton"]',
  '[role="textbox"]',
  '[role="combobox"]',
  '[role="listbox"]',
  '[role="option"]',
  '[aria-haspopup]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const SELECTABLE_TEXT_SELECTOR = [
  'p',
  'span',
  'strong',
  'em',
  'small',
  'blockquote',
  'pre',
  'code',
  'kbd',
  'samp',
  'li',
  'dt',
  'dd',
  'th',
  'td',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
].join(',');

function hasDirectReadableText(element: Element) {
  return Array.from(element.childNodes).some(
    (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()
  );
}

function isPointerOnScrollableGutter(event: React.PointerEvent<HTMLElement>, element: HTMLElement) {
  const style = window.getComputedStyle(element);
  const hasScrollableY =
    /(auto|scroll|overlay)/.test(style.overflowY) &&
    element.scrollHeight > element.clientHeight + 1;
  const hasScrollableX =
    /(auto|scroll|overlay)/.test(style.overflowX) && element.scrollWidth > element.clientWidth + 1;
  const rect = element.getBoundingClientRect();
  const verticalScrollbarWidth = element.offsetWidth - element.clientWidth;
  const horizontalScrollbarHeight = element.offsetHeight - element.clientHeight;

  return (
    (hasScrollableY &&
      verticalScrollbarWidth > 0 &&
      event.clientX >= rect.right - verticalScrollbarWidth - 2) ||
    (hasScrollableX &&
      horizontalScrollbarHeight > 0 &&
      event.clientY >= rect.bottom - horizontalScrollbarHeight - 2)
  );
}

function isSelectableTextTarget(element: Element) {
  const text = element.textContent?.trim();
  if (!text) return false;

  return element.matches(SELECTABLE_TEXT_SELECTOR) || hasDirectReadableText(element);
}

export function shouldStartWindowBodyDrag(
  event: React.PointerEvent<HTMLElement>,
  dragBoundary: HTMLElement
) {
  if (event.defaultPrevented || event.button !== 0 || event.isPrimary === false) {
    return false;
  }

  if (!(event.target instanceof Element) || !dragBoundary.contains(event.target)) {
    return false;
  }

  let element: Element | null = event.target;
  while (element && element !== dragBoundary) {
    if (element.matches(BODY_DRAG_BLOCK_SELECTOR)) return false;

    if (element instanceof HTMLElement) {
      const cursor = window.getComputedStyle(element).cursor;
      if (
        cursor === 'pointer' ||
        cursor === 'text' ||
        isPointerOnScrollableGutter(event, element)
      ) {
        return false;
      }
    }

    if (isSelectableTextTarget(element)) return false;

    element = element.parentElement;
  }

  return true;
}

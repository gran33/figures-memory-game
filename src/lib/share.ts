import type { Character, Language } from '../types';
import { format, getUi } from '../i18n';

/**
 * Shares a character card via the native Web Share API (WhatsApp, Messages, …),
 * with a clipboard fallback for desktop browsers.
 */
export async function shareCharacter(character: Character, language: Language): Promise<void> {
  const ui = getUi(language);
  const locale = character.languages[language];
  const text = format(ui.shareText, { name: locale.name, emoji: character.emoji });
  const url = window.location.origin;
  try {
    if (navigator.share) {
      await navigator.share({ title: ui.appTitle, text, url });
    } else {
      await navigator.clipboard?.writeText(`${text} ${url}`);
    }
  } catch {
    // user cancelled the share sheet — nothing to do
  }
}

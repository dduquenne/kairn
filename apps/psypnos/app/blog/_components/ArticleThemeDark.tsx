"use client";

import { THEME_DARK, COLOR_PALETTE } from "@/app/blog/_constants/themeConstants";

import { BlogContent } from "./BlogContent";

interface ArticleThemeDarkProps {
  content: string;
}

/**
 * ============================================================================
 * COMPOSANT POUR AFFICHER L'ARTICLE EN MODE NUIT (DARK)
 * ============================================================================
 *
 * Ce composant applique tous les styles spécifiques au mode nuit:
 * - Fond clair (ivory)
 * - Texte très foncé (night)
 * - Accent or standard (gold)
 *
 * Pour modifier les couleurs du mode nuit, modifiez les valeurs dans:
 * app/blog/_constants/themeConstants.ts > THEME_DARK
 */
export function ArticleThemeDark({ content }: ArticleThemeDarkProps) {
  const boxStyles = THEME_DARK.box;
  const contentVars = THEME_DARK.components;
  const typographyVars = THEME_DARK.typography;
  const spacingVars = THEME_DARK.spacing;
  const otherVars = THEME_DARK.other;

  return (
    <div
      suppressHydrationWarning
      className="rounded-lg border backdrop-blur-md transition-all duration-300 p-[1.1rem] sm:p-[1.6rem_1.2rem]"
      style={{
        backgroundColor: boxStyles.backgroundColor,
        borderColor: boxStyles.borderColor,
        borderWidth: "1px",
      }}
    >
      {/* Conteneur avec max-width optimale pour la lecture (60-80 caractères) */}
      <div className="max-w-none mx-auto" style={{ maxWidth: "720px" }}>
        {/* Wrapper pour appliquer les styles de thème au contenu HTML */}
        <div
          style={{
            // Typographie
            "--article-text-color": typographyVars.bodyTextColor,
            "--article-heading-color": typographyVars.headingColor,
            "--article-heading-h3-color": typographyVars.headingH3Color,
            "--article-muted-text": typographyVars.mutedTextColor,
            "--article-link-color": typographyVars.linkColor,
            "--article-link-hover-color": typographyVars.linkHoverColor,
            // Composants
            "--article-code-inline-bg": contentVars.codeInlineBg,
            "--article-code-inline-text": contentVars.codeInlineText,
            "--article-code-block-bg": contentVars.codeBlockBg,
            "--article-code-block-text": contentVars.codeBlockText,
            "--article-blockquote-border": contentVars.blockquoteBorder,
            "--article-blockquote-text": contentVars.blockquoteText,
            "--article-blockquote-bg": contentVars.blockquoteBg,
            // Callouts
            "--article-callout-note-border": contentVars.calloutNoteBorder,
            "--article-callout-note-bg": contentVars.calloutNoteBg,
            "--article-callout-note-text": contentVars.calloutNoteText,
            "--article-callout-note-icon": contentVars.calloutNoteIcon,
            "--article-callout-tip-border": contentVars.calloutTipBorder,
            "--article-callout-tip-bg": contentVars.calloutTipBg,
            "--article-callout-tip-text": contentVars.calloutTipText,
            "--article-callout-tip-icon": contentVars.calloutTipIcon,
            "--article-callout-warning-border": contentVars.calloutWarningBorder,
            "--article-callout-warning-bg": contentVars.calloutWarningBg,
            "--article-callout-warning-text": contentVars.calloutWarningText,
            "--article-callout-warning-icon": contentVars.calloutWarningIcon,
            "--article-callout-quote-border": contentVars.calloutQuoteBorder,
            "--article-callout-quote-bg": contentVars.calloutQuoteBg,
            "--article-callout-quote-text": contentVars.calloutQuoteText,
            "--article-callout-quote-icon": contentVars.calloutQuoteIcon,
            "--article-table-border": contentVars.tableBorder,
            "--article-table-header-bg": contentVars.tableHeaderBg,
            "--article-table-header-text": contentVars.tableHeaderText,
            "--article-table-body-text": contentVars.tableBodyText,
            "--article-list-text": contentVars.listItemText,
            "--article-list-marker": contentVars.listMarkerColor,
            "--article-list-marker-bg": contentVars.listMarkerBg,
            "--article-list-unordered-marker": contentVars.listUnorderedMarker,
            "--article-list-ordered-marker-text": contentVars.listOrderedMarkerText,
            "--article-list-ordered-marker-bg": contentVars.listOrderedMarkerBg,
            "--article-hr-color": contentVars.hrColor,
            "--article-mark-bg": contentVars.markBg,
            "--article-mark-text": contentVars.markText,
            // Espacement
            "--article-paragraph-margin-bottom": spacingVars.paragraphMarginBottom,
            "--article-heading-margin-top": spacingVars.headingMarginTop,
            "--article-heading-margin-bottom": spacingVars.headingMarginBottom,
            "--article-code-inline-padding": spacingVars.codeInlinePadding,
            "--article-code-block-padding": spacingVars.codeBlockPadding,
            // Autres
            "--article-line-height": otherVars.lineHeight,
            "--article-letter-spacing": otherVars.letterSpacing,
          } as React.CSSProperties & Record<string, string>}
        >
          <style>{`
            /* ============================================================================
               MODE NUIT (DARK) - Styles pour le contenu de l'article
               ============================================================================
               Fond: Clair (Ivory)
               Texte: Très foncé (Night)
               Accent: Or standard (Gold)

               Modification: Changez les valeurs dans themeConstants.ts > THEME_DARK
            */

            article {
              color: var(--article-text-color);
              line-height: var(--article-line-height);
              letter-spacing: var(--article-letter-spacing);
            }

            /* Typographie - Paragraphes et texte standard */
            article p {
              color: var(--article-text-color) !important;
              margin-bottom: var(--article-paragraph-margin-bottom);
            }

            article li {
              color: var(--article-text-color) !important;
            }

            /* Typographie - Titres */
            article h1,
            article h2,
            article h4,
            article h5,
            article h6 {
              color: var(--article-heading-color) !important;
              margin-top: var(--article-heading-margin-top);
              margin-bottom: var(--article-heading-margin-bottom);
              font-weight: 600;
            }

            /* Typographie - Titre 3 spécifique (or foncé) */
            article h3 {
              color: var(--article-heading-h3-color) !important;
              margin-top: var(--article-heading-margin-top);
              margin-bottom: var(--article-heading-margin-bottom);
              font-weight: 600;
            }

            /* Typographie - Texte fort */
            article strong {
              color: var(--article-heading-color) !important;
              font-weight: 600;
            }

            /* Liens */
            article a {
              color: var(--article-link-color) !important;
              text-decoration: underline;
              transition: color 0.3s ease;
            }

            article a:hover {
              color: var(--article-link-hover-color) !important;
            }

            /* Code inline */
            article code:not(pre code) {
              background-color: var(--article-code-inline-bg) !important;
              color: var(--article-code-inline-text) !important;
              padding: var(--article-code-inline-padding);
              border-radius: 0.375rem;
              font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
              font-size: 0.875em;
            }

            /* Blocs de code */
            article pre {
              background-color: var(--article-code-block-bg) !important;
              color: var(--article-code-block-text) !important;
              padding: var(--article-code-block-padding);
              border-radius: 0.5rem;
              overflow-x: auto;
            }

            article pre code {
              color: var(--article-code-block-text) !important;
              background: none;
              padding: 0;
            }

            /* Blockquotes */
            article blockquote {
              border-left: 4px solid var(--article-blockquote-border) !important;
              color: var(--article-blockquote-text) !important;
              padding-left: 1.5rem;
              margin-left: 0;
              margin-right: 0;
              font-style: italic;
              background-color: var(--article-blockquote-bg) !important;
            }

            /* Tableaux */
            article table {
              border-collapse: collapse;
              width: 100%;
              margin: 1.5rem 0;
            }

            article table {
              border: 1px solid var(--article-table-border) !important;
            }

            article th {
              background-color: var(--article-table-header-bg) !important;
              color: var(--article-table-header-text) !important;
              padding: 0.75rem;
              text-align: left;
              font-weight: 600;
              border: 1px solid var(--article-table-border) !important;
            }

            article td {
              color: var(--article-table-body-text) !important;
              padding: 0.75rem;
              border: 1px solid var(--article-table-border) !important;
            }

            /* Listes */
            article ul,
            article ol {
              margin-bottom: var(--article-paragraph-margin-bottom);
              padding-left: 2rem;
            }

            article ul li {
              list-style-type: disc;
              color: var(--article-list-text) !important;
            }

            article ol li {
              list-style-type: decimal;
              color: var(--article-list-text) !important;
            }

            /* Séparateurs */
            article hr {
              border: none;
              border-top: 1px solid var(--article-hr-color);
              margin: 2rem 0;
            }

            /* Highlights/Marks */
            article mark {
              background-color: var(--article-mark-bg) !important;
              color: var(--article-mark-text) !important;
              padding: 0.1rem 0.4rem;
              border-radius: 0.25rem;
            }
          `}</style>

          <article>
            <BlogContent content={content} />
          </article>
        </div>
      </div>
    </div>
  );
}

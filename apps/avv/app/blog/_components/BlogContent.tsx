'use client';

import { useState, useEffect } from 'react';
import "highlight.js/styles/atom-one-dark.css";
import "./markdown.css";

interface BlogContentProps {
  content: string;
}

export function BlogContent({ content }: BlogContentProps) {
  // Afficher le contenu brut initialement, puis le sanitizer côté client
  const [sanitizedContent, setSanitizedContent] = useState<string>(content);

  useEffect(() => {
    // SÉCURITÉ : Import dynamique côté client uniquement pour éviter
    // la dépendance à jsdom côté serveur (mode standalone)
    import('isomorphic-dompurify').then((DOMPurify) => {
      const clean = DOMPurify.default.sanitize(content, {
        ADD_TAGS: ['iframe'], // Pour les embeds vidéo si nécessaire
        ADD_ATTR: ['target', 'rel'], // Pour les liens externes
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      });
      setSanitizedContent(clean);
    });
  }, [content]);

  return (
    <div
      className="blog-content"
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}

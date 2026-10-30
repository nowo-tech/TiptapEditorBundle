<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle\Security;

/**
 * Sanitizes rich-text HTML from Tiptap before persistence (opt-in via bundle config).
 */
interface TiptapHtmlSanitizerInterface
{
    /**
     * Sanitizes editor HTML before it is stored (server-side counterpart of the client allow-list).
     *
     * @param string $html raw HTML submitted by the editor
     *
     * @return string the sanitized HTML
     */
    public function sanitize(string $html): string;
}

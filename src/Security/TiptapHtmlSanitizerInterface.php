<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle\Security;

/**
 * Sanitizes rich-text HTML from Tiptap before persistence (opt-in via bundle config).
 */
interface TiptapHtmlSanitizerInterface
{
    public function sanitize(string $html): string;
}
